import {
  MAX_VISIBLE_OUTPUT_CHARS,
  PYODIDE_INDEX_PATH,
  PYODIDE_PACKAGE_BASE_URL,
  PYTHON_WORKER_PATH,
  STDIN_BUFFER_BYTES,
  STOP_GRACE_MS,
} from "./config";
import { OutputLog, type OutputSegment } from "./output";
import {
  SIGINT,
  STDIN_CANCELLED,
  STDIN_READY,
  STDIN_WAITING,
  type FromWorker,
  type RunFile,
  type RunOutcome,
  type ToWorker,
} from "./protocol";

/**
 * The workspace's handle on the Python worker. One runtime per browser tab is
 * shared by every workspace screen, so moving between assignments doesn't
 * reload Python. Files always live in Convex; restarting Python never loses
 * them, only variables from the last run.
 */
export type RuntimeStatus =
  | { kind: "idle" }
  | { kind: "loading"; step: string }
  | { kind: "ready" }
  | { kind: "running"; startedAt: number; waitingForInput: boolean }
  | { kind: "stopping" }
  | { kind: "installing"; name: string }
  | { kind: "unavailable"; message: string };

export type LastRun = {
  outcome: RunOutcome;
  ms: number;
  entry: string;
  /** Stop had to restart Python because it didn't interrupt in time. */
  restarted: boolean;
};

export type RuntimeSnapshot = {
  status: RuntimeStatus;
  output: OutputSegment[];
  outputTrimmed: boolean;
  outputDropped: boolean;
  lastRun: LastRun | null;
  currentEntry: string | null;
  packageStatus: string | null;
  pythonVersion: string | null;
  /** Stop and input() use shared memory only on cross-origin isolated pages. */
  isolated: boolean;
};

type PendingInstall = { resolve: (result: { ok: boolean; message: string }) => void };

/** The parts of a Worker the runtime uses (lets tests supply a fake). */
export type WorkerLike = Pick<Worker, "postMessage" | "terminate"> & {
  onmessage: ((event: MessageEvent<FromWorker>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
};

type RuntimeOptions = {
  createWorker?: () => WorkerLike;
  /** Overrides cross-origin isolation detection (tests). */
  isolated?: boolean;
};

function createModuleWorker(): WorkerLike {
  // Built by scripts/prepare-python.mjs, not Next's bundler: Pyodide needs a
  // module worker and Next starts workers as classic scripts.
  return new Worker(PYTHON_WORKER_PATH, { type: "module", name: "python" }) as WorkerLike;
}

export class PythonRuntime {
  private worker: WorkerLike | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly log = new OutputLog(MAX_VISIBLE_OUTPUT_CHARS);
  private readonly isolated: boolean;
  private readonly createWorker: () => WorkerLike;
  private interrupt: Uint8Array | null = null;
  private stdinControl: Int32Array | null = null;
  private stdinData: Uint8Array | null = null;
  private runId = 0;
  private runStartedAt = 0;
  private requestId = 0;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly installs = new Map<number, PendingInstall>();
  private owner: string | null = null;
  private snapshot: RuntimeSnapshot;

  constructor(options: RuntimeOptions = {}) {
    this.isolated =
      options.isolated ??
      (typeof SharedArrayBuffer !== "undefined" && globalThis.crossOriginIsolated === true);
    this.createWorker = options.createWorker ?? createModuleWorker;
    this.snapshot = {
      status: { kind: "idle" },
      output: [],
      outputTrimmed: false,
      outputDropped: false,
      lastRun: null,
      currentEntry: null,
      packageStatus: null,
      pythonVersion: null,
      isolated: this.isolated,
    };
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  private update(patch: Partial<RuntimeSnapshot>) {
    this.snapshot = {
      ...this.snapshot,
      ...patch,
      output: this.log.segments,
      outputTrimmed: this.log.trimmed,
    };
    this.listeners.forEach((listener) => listener());
  }

  private setStatus(status: RuntimeStatus) {
    this.update({ status });
  }

  /**
   * A workspace takes over the runtime. Switching to another workspace stops
   * any running program and clears the output.
   */
  claim(owner: string) {
    if (this.owner === owner) return;
    this.owner = owner;
    if (this.snapshot.status.kind === "running") this.stop();
    this.log.clear();
    this.update({ lastRun: null, currentEntry: null, outputDropped: false, packageStatus: null });
  }

  /** Loads Python if it isn't loaded or loading. */
  start() {
    if (this.worker !== null) return;
    this.spawn();
  }

  private spawn() {
    if (this.isolated) {
      this.interrupt = new Uint8Array(new SharedArrayBuffer(1));
      this.stdinControl = new Int32Array(new SharedArrayBuffer(8));
      this.stdinData = new Uint8Array(new SharedArrayBuffer(STDIN_BUFFER_BYTES));
    }
    const worker = this.createWorker();
    this.worker = worker;
    worker.onmessage = (event: MessageEvent<FromWorker>) => this.handle(event.data);
    worker.onerror = (event) => {
      event.preventDefault?.();
      this.failLoad(event.message || "The Python worker didn’t start.");
    };
    this.setStatus({ kind: "loading", step: "Downloading Python…" });
    const init: ToWorker = {
      type: "init",
      indexUrl: new URL(PYODIDE_INDEX_PATH, globalThis.location?.origin ?? "http://localhost").toString(),
      packageBaseUrl: PYODIDE_PACKAGE_BASE_URL,
      interrupt: (this.interrupt?.buffer as SharedArrayBuffer | undefined) ?? null,
      stdinControl: (this.stdinControl?.buffer as SharedArrayBuffer | undefined) ?? null,
      stdinData: (this.stdinData?.buffer as SharedArrayBuffer | undefined) ?? null,
    };
    worker.postMessage(init);
  }

  private failLoad(detail: string) {
    this.worker?.terminate();
    this.worker = null;
    console.error("Python failed to load:", detail);
    this.setStatus({
      kind: "unavailable",
      message: "Python couldn’t load. Check your connection, then try again.",
    });
  }

  private handle(message: FromWorker) {
    switch (message.type) {
      case "loading":
        this.setStatus({ kind: "loading", step: message.step });
        return;
      case "ready":
        this.update({ status: { kind: "ready" }, pythonVersion: message.pythonVersion });
        return;
      case "load-failed":
        this.failLoad(message.message);
        return;
      case "output":
        if (message.runId !== this.runId) return;
        for (const chunk of message.chunks) this.log.append(chunk);
        this.update({});
        return;
      case "output-dropped":
        if (message.runId === this.runId) this.update({ outputDropped: true });
        return;
      case "input-request":
        if (message.runId === this.runId && this.snapshot.status.kind === "running") {
          this.setStatus({ ...this.snapshot.status, waitingForInput: true });
        }
        return;
      case "package-status":
        this.update({ packageStatus: message.text });
        return;
      case "done":
        if (message.runId !== this.runId) return;
        this.clearStopTimer();
        this.update({
          status: { kind: "ready" },
          lastRun: {
            outcome: message.outcome,
            ms: message.ms,
            entry: this.snapshot.currentEntry ?? "",
            restarted: false,
          },
        });
        return;
      case "install-result": {
        const pending = this.installs.get(message.requestId);
        this.installs.delete(message.requestId);
        if (this.snapshot.status.kind === "installing") this.setStatus({ kind: "ready" });
        this.update({ packageStatus: message.message });
        pending?.resolve({ ok: message.ok, message: message.message });
        return;
      }
    }
  }

  /** Runs `entry` with these files. Only when Python is ready. */
  run(files: RunFile[], entry: string, packages: string[]) {
    if (this.worker === null || this.snapshot.status.kind !== "ready") return;
    this.runId += 1;
    this.runStartedAt = Date.now();
    this.log.clear();
    if (this.interrupt) this.interrupt[0] = 0;
    this.update({
      status: { kind: "running", startedAt: this.runStartedAt, waitingForInput: false },
      currentEntry: entry,
      lastRun: null,
      outputDropped: false,
      packageStatus: null,
    });
    this.worker.postMessage({ type: "run", runId: this.runId, files, entry, packages } satisfies ToWorker);
  }

  /** Sends one line to a program waiting in input(). */
  sendInput(text: string) {
    const status = this.snapshot.status;
    if (status.kind !== "running" || !status.waitingForInput) return;
    if (this.stdinControl === null || this.stdinData === null) return;
    const bytes = new TextEncoder().encode(text).slice(0, STDIN_BUFFER_BYTES);
    this.stdinData.set(bytes);
    Atomics.store(this.stdinControl, 1, bytes.length);
    Atomics.store(this.stdinControl, 0, STDIN_READY);
    Atomics.notify(this.stdinControl, 0);
    this.log.append({ stream: "stdout", kind: "input", text: `${text}\n` });
    this.update({ status: { ...status, waitingForInput: false } });
  }

  /**
   * Stops the running program: interrupt first, then restart Python if it
   * doesn't stop within the grace period (or can't be interrupted at all).
   */
  stop() {
    if (this.snapshot.status.kind !== "running") return;
    if (this.interrupt === null || this.stdinControl === null) {
      this.restartAfterStop();
      return;
    }
    this.interrupt[0] = SIGINT;
    if (Atomics.load(this.stdinControl, 0) === STDIN_WAITING) {
      Atomics.store(this.stdinControl, 0, STDIN_CANCELLED);
      Atomics.notify(this.stdinControl, 0);
    }
    this.setStatus({ kind: "stopping" });
    this.clearStopTimer();
    this.stopTimer = setTimeout(() => this.restartAfterStop(), STOP_GRACE_MS);
  }

  private restartAfterStop() {
    this.clearStopTimer();
    const entry = this.snapshot.currentEntry ?? "";
    this.terminate();
    this.log.append({
      stream: "stderr",
      kind: "note",
      text: "\nPython was restarted to stop your program. Your files are safe; variables from this run are gone.\n",
    });
    this.update({
      lastRun: { outcome: "stopped", ms: Date.now() - this.runStartedAt, entry, restarted: true },
    });
    this.spawn();
  }

  private clearStopTimer() {
    if (this.stopTimer !== null) clearTimeout(this.stopTimer);
    this.stopTimer = null;
  }

  private terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.runId += 1; // Ignore anything the old worker still had queued.
    for (const pending of this.installs.values()) {
      pending.resolve({ ok: false, message: "Python restarted before the install finished." });
    }
    this.installs.clear();
  }

  /** Starts Python again from scratch (after a failed load, or on request). */
  restart() {
    this.clearStopTimer();
    this.terminate();
    this.spawn();
  }

  /** Installs a package into the running Python with micropip. */
  install(name: string): Promise<{ ok: boolean; message: string }> {
    if (this.worker === null || this.snapshot.status.kind !== "ready") {
      return Promise.resolve({ ok: false, message: "Wait for Python to be ready, then try again." });
    }
    this.requestId += 1;
    const requestId = this.requestId;
    this.update({ status: { kind: "installing", name }, packageStatus: `Installing ${name}…` });
    return new Promise((resolve) => {
      this.installs.set(requestId, { resolve });
      this.worker!.postMessage({ type: "install", requestId, name } satisfies ToWorker);
    });
  }

  clearOutput() {
    if (this.snapshot.status.kind === "running") return;
    this.log.clear();
    this.update({ outputDropped: false });
  }
}

let shared: PythonRuntime | null = null;

/** The tab's shared runtime (browser only). */
export function getPythonRuntime(): PythonRuntime {
  shared ??= new PythonRuntime();
  return shared;
}
