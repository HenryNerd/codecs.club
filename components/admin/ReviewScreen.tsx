"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CodeView } from "@/components/ui/CodeView";
import { Pill, type PillTone } from "@/components/ui/Pill";
import { PreviewBanner } from "@/components/ui/PreviewBanner";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CheckResults } from "@/components/workspace/CheckResults";
import { cn } from "@/lib/cn";
import { FIXTURE_TIME_ZONE as TZ, reviewFixture, type ReviewQueueItem } from "@/lib/fixtures";
import { formatShortDate, formatWeekdayDate } from "@/lib/format";

const stateLabel: Record<ReviewQueueItem["state"], { text: string; tone: PillTone }> = {
  newAttempt: { text: "New attempt", tone: "amberSolid" },
  unreviewed: { text: "Unreviewed", tone: "amber" },
  reviewed: { text: "Reviewed", tone: "violet" },
  notTurnedIn: { text: "Not turned in", tone: "neutral" },
};

const PHASE_HINT = "Reviewing and returning work arrive in Phase 6.";

/** 4j. Submitted snapshots with expected vs actual output, checks and optional feedback. */
export function ReviewScreen() {
  const data = reviewFixture;
  const selected = data.selected;
  const latest = selected.attempts[selected.attempts.length - 1]!;
  const [attempt, setAttempt] = useState(String(latest.attempt));
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [privateOpen, setPrivateOpen] = useState(false);
  const [privateNote, setPrivateNote] = useState("");
  const waiting = data.queue.filter((q) => q.state === "newAttempt" || q.state === "unreviewed").length;
  const firstName = selected.studentName.split(" ")[0];
  const earlier = selected.attempts.filter((a) => a.attempt < latest.attempt);

  return (
    <main className="flex flex-col pb-10">
      <div className="flex flex-wrap items-end gap-3 px-7 pt-4">
        <h1 className="m-0 text-[46px] leading-[1.04] font-extrabold tracking-[-.035em]">Review</h1>
        <span className="mb-0.5 flex h-10 items-center rounded-[10px] border-[1.5px] border-bd bg-bg px-3.5 font-bold">
          {data.dayLabel}
        </span>
        <span className="mb-0.5 flex h-10 items-center rounded-[10px] border-[1.5px] border-bd bg-bg px-3.5 font-bold">
          {data.assignmentTitle}
        </span>
        <span className="mb-2.5 ml-auto text-sm font-semibold text-ink2">{waiting} waiting for review</span>
      </div>
      <PreviewBanner phase="Phase 6" className="mx-7 mt-3" />

      <div className="grid gap-4 px-7 pt-3.5 xl:grid-cols-[272px_minmax(0,1fr)_372px]">
        <nav aria-label="Submissions" className="flex flex-col gap-0.5 self-start rounded-[20px] bg-sf p-2">
          {data.queue.map((item) => {
            const current = item.loginCode === selected.loginCode;
            const label = stateLabel[item.state];
            return (
              <div
                key={item.loginCode}
                aria-current={current || undefined}
                className={cn(
                  "flex flex-col gap-0.5 rounded-[14px] px-3 py-2.5",
                  current && "bg-pill shadow-[0_1px_2px_rgba(14,23,20,.12)]",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <b className="font-bold">{item.studentName}</b>
                  <Pill tone={label.tone} className="text-[11.5px]">
                    {label.text}
                  </Pill>
                </span>
                <span className="truncate text-[13px] text-ink3">{item.summary}</span>
              </div>
            );
          })}
        </nav>

        <section aria-label="Submitted snapshot" className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline gap-2.5">
            <h2 className="m-0 text-[26px] leading-[1.15] font-extrabold tracking-[-.03em]">
              {selected.studentName}
            </h2>
            <span className="text-sm text-ink3">
              {selected.loginCode} · Day 5 · {data.assignmentTitle}
            </span>
          </div>
          <SegmentedControl
            label="Attempts"
            className="self-start bg-sf [&>button]:h-8"
            options={selected.attempts.map((a) => ({
              value: String(a.attempt),
              label: `Attempt ${a.attempt} · ${a.reviewed ? "reviewed" : "new"}`,
            }))}
            value={attempt}
            onChange={setAttempt}
          />
          <div className="scheme-dark overflow-hidden rounded-[18px] bg-code-bg text-code-ink">
            <div className="flex h-[42px] items-center gap-2.5 bg-code-bar px-3.5 text-[13px]">
              <b className="font-mono text-[13px] font-semibold">{selected.snapshot.file}</b>
              <span className="text-ink3">
                Submitted snapshot · v{selected.snapshot.version} · read-only
              </span>
              <Link href="/admin/assistance" className="ml-auto font-bold text-mint-i no-underline">
                Open live working copy →
              </Link>
            </div>
            <CodeView
              code={selected.snapshot.code}
              label={`${selected.studentName}'s submitted ${selected.snapshot.file}`}
              highlightLines={[selected.snapshot.failingLine]}
              highlightTone="error"
              className="py-3 text-sm leading-6"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1.5 rounded-2xl bg-sf px-3.5 py-3">
              <b className="text-[13px] font-bold">Expected</b>
              <pre className="m-0 font-mono text-[13px] leading-normal font-medium whitespace-pre-wrap">
                {selected.expected.joined}
                {"\n"}
                <span className="rounded bg-mint-s2 px-1 text-mint-i">{selected.expected.last}</span>
              </pre>
            </div>
            <div className="flex flex-col gap-1.5 rounded-2xl bg-sf px-3.5 py-3">
              <b className="text-[13px] font-bold">Actual · v{selected.snapshot.version}</b>
              <pre className="m-0 font-mono text-[13px] leading-normal font-medium whitespace-pre-wrap">
                {selected.actual.joined}
                {"\n"}
                <span className="rounded bg-cor-s px-1 text-cor-i">{selected.actual.last}</span>{" "}
                <b className="font-sans text-xs font-bold text-cor-i">{selected.actual.issue}</b>
              </pre>
            </div>
          </div>
          <span className="text-[12.5px] text-ink3">Lines shown joined. Line breaks don’t count.</span>
        </section>

        <aside aria-label="Check and review" className="flex flex-col gap-3 self-start rounded-[24px] bg-sf px-[18px] py-4">
          <div className="flex items-start justify-between gap-2">
            <CheckResults
              outcome={selected.check.outcome}
              parts={selected.check.parts}
              partialMin={selected.check.partialMin}
            />
            <span className="text-[12.5px] whitespace-nowrap text-ink3">
              Attempt {latest.attempt} · v{selected.snapshot.version}
            </span>
          </div>
          {earlier.map((a) => (
            <div key={a.attempt} className="rounded-[14px] bg-bg px-3 py-2.5 text-[13px] text-ink2">
              <b className="font-bold text-ink">Attempt {a.attempt}</b> · reviewed{" "}
              {a.reviewedAt ? formatShortDate(a.reviewedAt, TZ) : ""} ·{" "}
              {a.note ? "has a written note" : "no written note"}
            </div>
          ))}
          <div className="flex flex-col gap-2 rounded-2xl bg-bg p-3">
            {feedbackOpen ? (
              <>
                <label htmlFor="review-feedback" className="text-sm font-bold">
                  Written feedback{" "}
                  <span className="font-medium text-ink3">· optional · {firstName} sees this</span>
                </label>
                <textarea
                  id="review-feedback"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={`Write a note for ${firstName}…`}
                  className="min-h-[88px] rounded-xl border-[1.5px] border-bd bg-bg px-3 py-2.5 text-sm text-ink"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={() => {
                    setFeedbackOpen(false);
                    setFeedback("");
                  }}
                >
                  Remove
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="lg" className="self-start" onClick={() => setFeedbackOpen(true)}>
                  + Add written feedback
                </Button>
                <span className="text-[13px] text-ink3">
                  Optional. Skip it if you talked it through in class.
                </span>
              </>
            )}
          </div>
          {privateOpen ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-bg p-3">
              <label htmlFor="review-private" className="text-sm font-bold">
                Private note <span className="font-medium text-ink3">· admins only</span>
              </label>
              <textarea
                id="review-private"
                rows={2}
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                className="rounded-xl border-[1.5px] border-bd bg-bg px-3 py-2.5 text-sm text-ink"
              />
            </div>
          ) : (
            <Button variant="ghost" className="self-start" onClick={() => setPrivateOpen(true)}>
              + Private note · admins only
            </Button>
          )}
          <div className="mt-2 flex gap-2">
            <Button variant="primary" className="h-[46px] flex-1 rounded-xl text-[15px]" disabled title={PHASE_HINT}>
              Mark reviewed
            </Button>
            <Button variant="secondary" className="h-[46px] rounded-xl bg-bg text-[15px]" disabled title={PHASE_HINT}>
              Next →
            </Button>
          </div>
          <span className="text-xs text-ink3">
            Turn-in closes {formatWeekdayDate(data.turnInClosesAt, TZ)}. Reviewing doesn’t extend it.
          </span>
        </aside>
      </div>
    </main>
  );
}
