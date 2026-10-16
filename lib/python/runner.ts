import type { PyodideAPI } from "pyodide";
import type { RunFile, RunOutcome } from "./protocol";

/**
 * Runs student programs inside a loaded Pyodide. Kept free of worker and DOM
 * code so it can be tested in Node with the real runtime.
 */

export const WORK_DIR = "/home/pyodide/work";

/** Python helpers installed once per runtime as the `_codecs_runner` module. */
const RUNNER_SOURCE = String.raw`
import os
import sys
import traceback

WORK_DIR = ${JSON.stringify(WORK_DIR)}


def forget_workspace_modules():
    """Drop modules imported from the workspace so edited files reload."""
    for name, module in list(sys.modules.items()):
        path = getattr(module, "__file__", None) or ""
        if path.startswith(WORK_DIR):
            del sys.modules[name]


def _is_student_frame(frame):
    path = frame.f_code.co_filename
    if path.startswith("<"):  # <frozen runpy>, <string>, …
        return False
    return not os.path.isabs(path) or path.startswith(WORK_DIR)


def _print_student_traceback(exc):
    tb = exc.__traceback__
    # Hide the runner's own frames; start at the student's code.
    while tb is not None and not _is_student_frame(tb.tb_frame):
        tb = tb.tb_next
    text = "".join(traceback.format_exception(type(exc), exc, tb))
    sys.stderr.write(text.replace(WORK_DIR + "/", ""))


def run(entry):
    """Run entry as __main__ in a fresh namespace. Returns ok, error or stopped."""
    import runpy

    os.chdir(WORK_DIR)
    if WORK_DIR not in sys.path:
        sys.path.insert(0, WORK_DIR)
    forget_workspace_modules()
    try:
        runpy.run_path(entry, run_name="__main__")
        return "ok"
    except KeyboardInterrupt:
        return "stopped"
    except SystemExit as exc:
        if exc.code is None or exc.code == 0:
            return "ok"
        if not isinstance(exc.code, int):
            print(exc.code, file=sys.stderr)
        return "error"
    except BaseException as exc:
        _print_student_traceback(exc)
        return "error"
    finally:
        sys.stdout.flush()
        sys.stderr.flush()
`;

export function installRunner(pyodide: PyodideAPI) {
  pyodide.FS.mkdirTree(WORK_DIR);
  pyodide.FS.writeFile("/home/pyodide/_codecs_runner.py", RUNNER_SOURCE);
  pyodide.runPython(
    "import sys\nif '/home/pyodide' not in sys.path: sys.path.append('/home/pyodide')\nimport _codecs_runner",
  );
}

/**
 * Replaces the work folder with exactly these files, so each run starts from
 * the workspace as it is now (deleted files don't linger between runs).
 */
export function writeWorkspace(pyodide: PyodideAPI, files: RunFile[]) {
  const fs = pyodide.FS;
  for (const name of fs.readdir(WORK_DIR) as string[]) {
    if (name === "." || name === "..") continue;
    const path = `${WORK_DIR}/${name}`;
    if (fs.isDir(fs.stat(path).mode)) removeTree(pyodide, path);
    else fs.unlink(path);
  }
  for (const file of files) fs.writeFile(`${WORK_DIR}/${file.name}`, file.content);
}

function removeTree(pyodide: PyodideAPI, dir: string) {
  const fs = pyodide.FS;
  for (const name of fs.readdir(dir) as string[]) {
    if (name === "." || name === "..") continue;
    const path = `${dir}/${name}`;
    if (fs.isDir(fs.stat(path).mode)) removeTree(pyodide, path);
    else fs.unlink(path);
  }
  fs.rmdir(dir);
}

/** Runs the entry file. Output goes to whatever stdout/stderr Pyodide has. */
export function runEntry(pyodide: PyodideAPI, entry: string): RunOutcome {
  const runner = pyodide.pyimport("_codecs_runner");
  try {
    return runner.run(entry) as RunOutcome;
  } finally {
    runner.destroy();
  }
}

/** Picks the file Run executes: main.py, else the shown .py file, else the first .py file. */
export function chooseEntry(fileNames: string[], shown: string | null, preferred: string): string | null {
  if (fileNames.includes(preferred)) return preferred;
  if (shown !== null && shown.endsWith(".py") && fileNames.includes(shown)) return shown;
  return fileNames.find((n) => n.endsWith(".py")) ?? null;
}

/**
 * Loads Pyodide-built packages the code imports (numpy, …) on demand. Standard
 * library modules need nothing. Progress goes to `log`, not program output.
 */
export async function loadImportedPackages(
  pyodide: PyodideAPI,
  files: RunFile[],
  log: (text: string) => void,
) {
  const code = files
    .filter((f) => f.name.endsWith(".py"))
    .map((f) => f.content)
    .join("\n");
  await pyodide.loadPackagesFromImports(code, {
    messageCallback: log,
    errorCallback: log,
  });
}

/** Installs a package with micropip (pure-Python wheels from PyPI, or Pyodide builds). */
export async function installPackage(
  pyodide: PyodideAPI,
  name: string,
  log: (text: string) => void,
): Promise<{ ok: boolean; message: string }> {
  await pyodide.loadPackage("micropip", { messageCallback: log, errorCallback: log });
  const micropip = pyodide.pyimport("micropip");
  try {
    await micropip.install(name);
    return { ok: true, message: `Installed ${name}.` };
  } catch (error) {
    return { ok: false, message: explainInstallError(name, String(error)) };
  } finally {
    micropip.destroy();
  }
}

/** Turns micropip failures into messages a student can act on. */
export function explainInstallError(name: string, raw: string): string {
  if (/pure Python 3 wheel|wasm32|emscripten|binary wheel/i.test(raw)) {
    return `${name} can’t be installed in the browser: it needs compiled code that isn’t available here. Ask your teacher for another way.`;
  }
  if (/No known package|Can't fetch metadata|404|not found on PyPI|no matching distribution/i.test(raw)) {
    return `Couldn’t find a package named “${name}”. Check the spelling.`;
  }
  if (/fetch|network|NetworkError|Failed to load/i.test(raw)) {
    return `Couldn’t reach the package index to install ${name}. Check your connection and try again.`;
  }
  return `${name} couldn’t be installed. ${raw.split("\n").filter(Boolean).pop() ?? ""}`.trim();
}

export { packageSpecProblem } from "@/convex/lib/packages";
