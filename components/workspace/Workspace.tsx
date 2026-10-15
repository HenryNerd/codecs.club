"use client";

import Link from "next/link";
import { useState } from "react";
import { useStudentViewer } from "@/components/auth/ViewerContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CodeView } from "@/components/ui/CodeView";
import { AssignmentTypeTag, Pill } from "@/components/ui/Pill";
import { PreviewBanner } from "@/components/ui/PreviewBanner";
import { TabPanel, Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { FIXTURE_TIME_ZONE as TZ, workspaceFixture } from "@/lib/fixtures";
import { formatRelative, formatTime, formatWeekdayDateTime } from "@/lib/format";
import { renderInlineMarkdown } from "@/lib/inlineMarkdown";
import { useNow } from "@/lib/useNow";
import { CheckResults } from "./CheckResults";

type PanelTab = "task" | "files" | "versions";

const PREVIEW_HINT = "Not connected yet (Phase 3–6).";

/**
 * 4d. Guided assignment workspace: task beside a Python editor, with output,
 * check results, help/assistance state and turn-in. Renders sample data until
 * the editor, runtime and persistence phases land.
 */
export function Workspace({ assignmentId }: { assignmentId: string }) {
  const viewer = useStudentViewer();
  const data = workspaceFixture;
  const now = useNow(1000);
  const [tab, setTab] = useState<PanelTab>("task");
  const [activeFile, setActiveFile] = useState(data.files[0]!.name);
  const [outputCleared, setOutputCleared] = useState(false);
  const file = data.files.find((f) => f.name === activeFile) ?? data.files[0]!;
  const firstName = viewer.name.split(" ")[0] ?? viewer.name;
  const helpMinutes = Math.max(1, Math.round((now - data.help.requestedAt) / 60_000));

  return (
    <div className="flex h-dvh min-h-[600px] flex-col bg-bg" data-assignment-id={assignmentId}>
      <header className="flex h-[62px] flex-none items-center gap-3 px-5">
        <Link
          href="/learn"
          className="text-xl leading-none font-extrabold tracking-[-.03em] text-ink no-underline"
        >
          CodeCS
        </Link>
        <span aria-hidden="true" className="mx-1 h-[22px] w-px bg-ln" />
        <Link href="/learn" className="text-[15px] font-semibold text-ink2 no-underline">
          {data.assignment.dayLabel}
        </Link>
        <span aria-hidden="true" className="text-bd">
          /
        </span>
        <h1 className="m-0 text-[21px] leading-none font-extrabold tracking-[-.025em]">
          {data.assignment.title}
        </h1>
        <AssignmentTypeTag type={data.assignment.type} />

        <div className="ml-auto flex items-center gap-2">
          <Pill tone="mint" className="h-[30px] px-2.5 text-[13px] font-semibold" >
            <span role="status">✓ Saved {formatRelative(data.save.savedAt, now, TZ)}</span>
          </Pill>
          <span
            role="status"
            className="inline-flex h-[30px] items-center gap-2 rounded-full bg-vio-s pr-3 pl-1 text-[13px] font-bold text-vio-i"
          >
            <Avatar name={data.teacher.name} tone="violet" size={22} className="text-[8px]" />
            {data.teacher.name} joined
          </span>
          <button
            type="button"
            aria-pressed="true"
            disabled
            title={PREVIEW_HINT}
            className="inline-flex h-9 items-center rounded-[10px] border-0 bg-vio px-3.5 text-sm font-bold whitespace-nowrap text-on-vio"
          >
            Help requested · {helpMinutes} min
          </button>
          <ButtonLink href={data.assignment.slidesUrl} external variant="ghost" size="md">
            Slides ↗
          </ButtonLink>
          <span className="ml-1 flex items-center gap-2">
            <Avatar name={viewer.name} size={30} className="text-[11px]" />
            <b className="text-sm font-bold">{firstName}</b>
          </span>
        </div>
      </header>
      <PreviewBanner phase="Phases 3–6" className="mx-3 mb-2" />

      <div className="grid min-h-0 flex-1 grid-cols-[372px_minmax(0,1fr)] gap-3 px-3 pb-3">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[20px] bg-sf">
          <Tabs
            label="Assignment panels"
            idPrefix="ws"
            value={tab}
            onChange={setTab}
            className="flex-none px-2.5 pt-2.5"
            items={[
              { value: "task", label: "Task" },
              {
                value: "files",
                label: (
                  <>
                    Files <span className="font-mono text-xs font-medium text-ink3">{data.files.length}</span>
                  </>
                ),
              },
              { value: "versions", label: "Versions" },
            ]}
          />
          <TabPanel
            idPrefix="ws"
            value={tab}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-5 py-[18px]"
          >
            {tab === "task" && (
              <>
                <p className="m-0 text-base leading-[1.55] text-pretty">
                  {renderInlineMarkdown(data.assignment.instructions)}
                </p>
                <div className="flex flex-col gap-1.5">
                  <b className="text-[13px] font-bold">Expected output</b>
                  <pre className="m-0 rounded-[14px] bg-bg px-3.5 py-3 font-mono text-sm leading-normal font-medium">
                    {data.assignment.expectedOutput}
                  </pre>
                  <span className="text-[12.5px] text-ink3">
                    Spaces and line breaks don’t affect the check.
                  </span>
                </div>
              </>
            )}
            {tab === "files" && (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {data.files.map((f) => (
                  <li key={f.name}>
                    <button
                      type="button"
                      onClick={() => setActiveFile(f.name)}
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between rounded-[10px] border-0 px-3 py-2 text-left font-mono text-sm",
                        f.name === activeFile ? "bg-bg font-semibold" : "bg-transparent hover:bg-sf2",
                      )}
                    >
                      {f.name}
                      <span className="font-sans text-xs text-ink3">
                        {f.content.split("\n").length - 1} lines
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {tab === "versions" && (
              <ol className="m-0 flex list-none flex-col gap-1 p-0">
                {data.versions.map((version) => (
                  <li
                    key={version.number}
                    className="flex items-center justify-between rounded-[10px] bg-bg px-3 py-2 text-sm"
                  >
                    <span>
                      <b className="font-bold">v{version.number}</b>{" "}
                      <span className="text-ink3">
                        · {formatTime(version.at, TZ)} · {version.by}
                      </span>
                    </span>
                    <Button size="sm" variant="ghost" disabled title={PREVIEW_HINT}>
                      Restore
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </TabPanel>

          <div className="m-2.5 mt-0 flex flex-none flex-col gap-2.5 rounded-2xl bg-bg px-4 pt-3.5 pb-4">
            <div className="flex items-baseline justify-between">
              <b className="font-bold">{data.turnIn.submitted ? "Turned in" : "Not turned in"}</b>
              <span className="text-[13px] text-ink3">
                Closes {formatWeekdayDateTime(data.turnIn.closesAt, TZ)}
              </span>
            </div>
            <Button
              variant="primary"
              className="h-[46px] w-full rounded-xl text-base"
              disabled
              title={PREVIEW_HINT}
            >
              Turn in
            </Button>
            <span className="text-[12.5px] text-ink3">
              Sends your last saved version (v{data.turnIn.latestVersion}). You can keep editing after.
            </span>
          </div>
        </aside>

        <section
          aria-label="Python editor"
          className="scheme-dark flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[20px] bg-code-bg text-code-ink"
        >
          <div className="flex h-[52px] flex-none items-center gap-1.5 bg-code-bar pr-2.5 pl-3">
            {data.files.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setActiveFile(f.name)}
                aria-pressed={f.name === activeFile}
                className={cn(
                  "flex h-[34px] cursor-pointer items-center rounded-[9px] border-0 px-3.5 font-mono text-[13px]",
                  f.name === activeFile
                    ? "bg-code-bg font-semibold text-code-ink"
                    : "bg-transparent font-medium text-ink3",
                )}
              >
                {f.name}
              </button>
            ))}
            <button
              type="button"
              aria-label="New file"
              disabled
              title={PREVIEW_HINT}
              className="size-[34px] rounded-[9px] border-0 bg-transparent text-lg text-ink3"
            >
              +
            </button>
            <span className="ml-auto flex gap-0.5">
              {["Upload", "Download", "Packages"].map((label) => (
                <Button key={label} variant="ghost" size="sm" disabled title={PREVIEW_HINT}>
                  {label}
                </Button>
              ))}
            </span>
            <span aria-hidden="true" className="mx-1.5 h-[22px] w-px bg-ln" />
            <span role="status" className="text-[13px] font-semibold text-mint-i">
              ● Python ready
            </span>
            <Button variant="primary" size="md" className="ml-1.5 px-[18px]" disabled title={PREVIEW_HINT}>
              ▶ Run
            </Button>
            <Button variant="secondary" size="md" disabled>
              ■ Stop
            </Button>
          </div>

          <CodeView
            code={file.content}
            label={`${file.name} (read-only preview)`}
            className="min-h-0 flex-1 py-4 text-[15px] leading-[26px]"
            highlightLines={file.name === "main.py" ? [data.teacher.cursorLine] : []}
            cursors={
              file.name === "main.py"
                ? [{ line: data.teacher.cursorLine, label: data.teacher.name, tone: "teacher" }]
                : []
            }
          />

          <div className="grid h-[232px] flex-none grid-cols-2 bg-code-bar">
            <section aria-label="Output" className="flex min-w-0 flex-col border-r border-ln">
              <div className="flex h-[42px] flex-none items-center gap-2.5 px-4">
                <b className="text-sm font-bold">Output</b>
                <Pill className="px-2.5 font-semibold">{data.run.errors} errors</Pill>
                <button
                  type="button"
                  onClick={() => setOutputCleared(true)}
                  className="ml-auto cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-ink3 hover:text-ink"
                >
                  Clear
                </button>
              </div>
              <pre
                aria-live="off"
                className="m-0 flex-1 overflow-auto px-4 font-mono text-sm leading-[1.45] font-medium text-code-ink"
              >
                {outputCleared ? "" : data.run.output}
              </pre>
              <div className="flex-none px-4 pt-2 pb-2.5 text-[12.5px] text-ink3">
                Finished in {data.run.seconds}s · run by {data.run.by} · v{data.run.version}
              </div>
            </section>
            <section aria-label="Check" className="flex min-w-0 flex-col">
              <div className="flex h-[42px] flex-none items-center gap-2.5 px-4">
                <b className="text-sm font-bold">Check</b>
                <span className="text-[13px] text-ink3">for v{data.check.version} · just now</span>
                <Button size="sm" variant="secondary" className="ml-auto h-7" disabled title={PREVIEW_HINT}>
                  Run check
                </Button>
              </div>
              <div className="flex flex-1 flex-col px-4 pt-0.5 pb-3">
                <CheckResults
                  outcome={data.check.outcome}
                  parts={data.check.parts}
                  partialMin={data.check.partialMin}
                />
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
