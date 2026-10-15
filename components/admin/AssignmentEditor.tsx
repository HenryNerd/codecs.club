"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CodeView } from "@/components/ui/CodeView";
import { TextInput } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { PreviewBanner } from "@/components/ui/PreviewBanner";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/cn";
import { partKindLabel, validatePartialRule, type PartKind } from "@/lib/evaluation";
import { assignmentEditorFixture, FIXTURE_TIME_ZONE as TZ } from "@/lib/fixtures";
import { formatTime } from "@/lib/format";
import { renderInlineMarkdown } from "@/lib/inlineMarkdown";

type Part = { name: string; kind: PartKind; expected: string };

const PHASE_HINT = "Saving and publishing assignments arrive in Phase 7.";

/** 4h. Guided/open-ended authoring: instructions, starter files, parts and the partial rule. */
export function AssignmentEditor() {
  const fixture = assignmentEditorFixture;
  const [type, setType] = useState(fixture.draft.type);
  const [title, setTitle] = useState(fixture.draft.title);
  const [instructions, setInstructions] = useState(fixture.draft.instructions);
  const [parts, setParts] = useState<Part[]>(fixture.draft.parts);
  const [partialMin, setPartialMin] = useState(fixture.draft.partialMin);
  const [loopCheck, setLoopCheck] = useState(fixture.draft.loopCheck);
  const rule = validatePartialRule(parts.length, partialMin);

  return (
    <main className="flex flex-col pb-10">
      <div className="flex flex-wrap items-end gap-3.5 px-7 pt-4">
        <div>
          <div className="text-sm text-ink3">{fixture.dayLabel} / Assignments</div>
          <h1 className="m-0 mt-0.5 text-[46px] leading-[1.04] font-extrabold tracking-[-.035em]">
            {title || "Untitled assignment"}
          </h1>
        </div>
        <Pill tone="amber" className="mb-2 h-7 px-3 text-[13px]">
          ○ Draft · saved {formatTime(fixture.savedAt, TZ)}
        </Pill>
        <div className="mb-0.5 ml-auto flex gap-2">
          <Button variant="secondary" size="lg" className="h-[42px]" disabled title={PHASE_HINT}>
            Save draft
          </Button>
          <Button variant="primary" size="lg" className="h-[42px]" disabled title={PHASE_HINT}>
            Publish to {fixture.dayShort}
          </Button>
        </div>
      </div>
      <PreviewBanner phase="Phase 7" className="mx-7 mt-3" />

      <div className="grid gap-[18px] px-7 pt-4 xl:grid-cols-[216px_minmax(0,1fr)_468px]">
        <nav
          aria-label={`${fixture.dayShort} assignments`}
          className="flex flex-col gap-0.5 self-start rounded-[20px] bg-sf p-2"
        >
          <b className="px-2.5 pt-1.5 pb-2 text-xs font-bold tracking-[.05em] text-ink3">
            {fixture.dayLabel.toUpperCase().replace(":", " ·")}
          </b>
          {fixture.siblings.map((s) => {
            const current = s.id === fixture.draft.id;
            return (
              <div
                key={s.id}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex flex-col rounded-xl px-3 py-[9px]",
                  current && "bg-pill shadow-[0_1px_2px_rgba(14,23,20,.12)]",
                )}
              >
                <b className="text-sm font-bold">{s.title}</b>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    s.status === "published" ? "text-mint-i" : "text-amb-i",
                  )}
                >
                  {s.status === "published" ? "● Published" : "○ Draft"} ·{" "}
                  {s.type === "guided" ? "guided" : "open-ended"}
                </span>
              </div>
            );
          })}
          <Button variant="ghost" size="md" className="mt-0.5 justify-start" disabled title={PHASE_HINT}>
            + New assignment
          </Button>
        </nav>

        <section aria-label="Assignment details" className="flex min-w-0 flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold">Type</span>
            <SegmentedControl
              label="Type"
              className="self-start bg-sf [&>button]:h-[34px]"
              options={[
                { value: "guided", label: "Guided" },
                { value: "open", label: "Open-ended" },
              ]}
              value={type}
              onChange={setType}
            />
            <span className="text-[12.5px] text-ink3">
              Guided work is checked against expected output. Open-ended work starts from a blank
              file and gets feedback only.
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assignment-title" className="text-sm font-bold">
              Title
            </label>
            <TextInput
              id="assignment-title"
              className="h-11"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assignment-instructions" className="text-sm font-bold">
              Instructions
            </label>
            <div className="overflow-hidden rounded-[14px] border-[1.5px] border-bd">
              <textarea
                id="assignment-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="block w-full resize-y border-0 bg-bg px-3.5 py-3 font-mono text-sm text-ink outline-none"
                aria-describedby="instructions-hint"
              />
              <div className="border-t border-ln bg-sf px-3.5 py-2.5 text-[15px]">
                <span className="mb-1 block text-xs font-bold text-ink3">Students see</span>
                {renderInlineMarkdown(instructions)}
              </div>
            </div>
            <span id="instructions-hint" className="text-[12.5px] text-ink3">
              Use **bold** and `code`.
            </span>
          </div>
          {type === "guided" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">Starter files</span>
              <div className="scheme-dark overflow-hidden rounded-[14px] bg-code-bg text-code-ink">
                <div className="flex h-[38px] items-center gap-1.5 bg-code-bar px-2">
                  {fixture.draft.starterFiles.map((f) => (
                    <span
                      key={f.name}
                      className="flex h-7 items-center rounded-[7px] bg-code-bg px-3 font-mono text-[12.5px] font-semibold"
                    >
                      {f.name}
                    </span>
                  ))}
                  <Button variant="ghost" size="sm" className="h-7 text-[12.5px]" disabled title={PHASE_HINT}>
                    + Add file
                  </Button>
                  <span className="ml-auto text-xs text-ink3">Copied into each student’s workspace</span>
                </div>
                <CodeView
                  code={fixture.draft.starterFiles[0]!.content}
                  label="main.py starter file"
                  className="py-2 text-[13.5px] leading-[22px]"
                />
              </div>
            </div>
          )}
        </section>

        {type === "guided" ? (
          <section
            aria-label="Evaluation"
            className="flex flex-col gap-2.5 self-start rounded-[24px] bg-sf p-[18px]"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="m-0 text-[22px] leading-[1.2] font-bold tracking-[-.02em]">Evaluation</h2>
              <span className="text-[12.5px] text-ink3">Checks output only. Whitespace ignored.</span>
            </div>
            {parts.map((part, i) => (
              <div
                key={i}
                className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-2.5 gap-y-1 rounded-2xl bg-bg p-3"
              >
                <span className="row-span-2 grid size-7 place-items-center rounded-full bg-mint-s2 text-[13px] font-extrabold text-mint-i">
                  {i + 1}
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <b className="text-sm font-bold">{part.name}</b>
                  <span className="text-[12.5px] whitespace-nowrap text-ink3">{partKindLabel[part.kind]}</span>
                </div>
                <span className="justify-self-start rounded-lg bg-sf px-[9px] py-[3px] font-mono text-[13px] font-medium">
                  {part.expected}
                </span>
              </div>
            ))}
            <Button
              variant="secondary"
              className="self-start bg-bg"
              onClick={() =>
                setParts((p) => [...p, { name: `Part ${p.length + 1}`, kind: "containsInOrder", expected: "" }])
              }
            >
              + Add part
            </Button>
            <div className="flex flex-col gap-1.5 rounded-2xl bg-bg p-3.5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <b className="font-bold">Partial completion</b>
                <span className="text-ink2">needs at least</span>
                <span className="inline-flex items-center gap-0.5 rounded-[10px] bg-sf p-[3px]">
                  <button
                    type="button"
                    aria-label="Fewer parts"
                    onClick={() => setPartialMin((n) => Math.max(0, n - 1))}
                    className="grid size-[26px] cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent font-bold"
                  >
                    −
                  </button>
                  <b
                    aria-live="polite"
                    className="grid h-[26px] min-w-[30px] place-items-center rounded-[7px] bg-pill font-extrabold shadow-[0_1px_2px_rgba(14,23,20,.12)]"
                  >
                    {partialMin}
                  </b>
                  <button
                    type="button"
                    aria-label="More parts"
                    onClick={() => setPartialMin((n) => Math.min(parts.length, n + 1))}
                    className="grid size-[26px] cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent font-bold"
                  >
                    +
                  </button>
                </span>
                <span className="text-ink2">of {parts.length} parts</span>
              </div>
              <span
                role="status"
                className={cn("text-[13px] font-semibold", rule.ok ? "text-mint-i" : "text-cor-i")}
              >
                {rule.ok ? "✓" : "✕"} {rule.message}
              </span>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-bg p-3.5">
              <input
                type="checkbox"
                role="switch"
                checked={loopCheck}
                onChange={(e) => setLoopCheck(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "relative mt-px h-6 w-10 flex-none rounded-xl shadow-[inset_0_0_0_1.5px_var(--bd)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-vio",
                  loopCheck ? "bg-mint" : "bg-sf2",
                )}
              >
                <i
                  className={cn(
                    "absolute top-[3px] size-[18px] rounded-full transition-all",
                    loopCheck ? "left-[19px] bg-on-mint" : "left-[3px] bg-bd",
                  )}
                />
              </span>
              <span className="text-sm">
                <b className="font-bold">Infinite-loop check</b>
                <br />
                <span className="text-[13px] text-ink3">
                  Watch up to 1,000 loop rounds instead of waiting for the program to end.
                </span>
              </span>
            </label>
          </section>
        ) : (
          <section aria-label="Evaluation" className="self-start rounded-[24px] bg-sf p-[18px]">
            <h2 className="m-0 text-[22px] leading-[1.2] font-bold tracking-[-.02em]">Evaluation</h2>
            <p className="mt-2 mb-0 text-sm text-ink2">
              Open-ended work has no output checks. Students start from a blank file and you give
              feedback when you review it.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
