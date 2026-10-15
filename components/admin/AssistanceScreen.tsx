"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CodeView } from "@/components/ui/CodeView";
import { TextInput } from "@/components/ui/Field";
import { Pill } from "@/components/ui/Pill";
import { PreviewBanner } from "@/components/ui/PreviewBanner";
import { cn } from "@/lib/cn";
import {
  assistanceCodeFixture,
  assistanceLessonFixture,
  seatsFixture,
  type Presence,
  type SeatStudent,
} from "@/lib/fixtures";

const presenceLabel: Record<Presence, { text: string; className: string }> = {
  online: { text: "● Online", className: "text-mint-i" },
  idle: { text: "◐ Idle", className: "text-amb-i" },
  offline: { text: "○ Offline", className: "text-ink3" },
};

/**
 * 4i. Live classroom: help queue, seating chart and the selected student's
 * live copy. Join/Leave/Resolve/note are local-only until Phase 9.
 */
export function AssistanceScreen() {
  const [selectedCode, setSelectedCode] = useState("jsmith");
  const [joined, setJoined] = useState<Record<string, boolean>>({ jsmith: true });
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  const people = seatsFixture.filter((s): s is SeatStudent => s !== null);
  const needsHelp = (s: SeatStudent) => s.helpWaitMin !== undefined && !resolved[s.loginCode];
  const queue = people
    .filter(needsHelp)
    .sort((a, b) => (b.helpWaitMin ?? 0) - (a.helpWaitMin ?? 0));
  const counts = {
    online: people.filter((p) => p.presence === "online").length,
    idle: people.filter((p) => p.presence === "idle").length,
    offline: people.filter((p) => p.presence === "offline").length,
  };
  const selected = people.find((p) => p.loginCode === selectedCode) ?? people[0]!;
  const selectedFirst = selected.name.split(" ")[0]!;
  const code = assistanceCodeFixture[selected.task]!;
  const isJoined = Boolean(joined[selected.loginCode]);
  const offline = selected.presence === "offline";

  function pick(loginCode: string) {
    setSelectedCode(loginCode);
    setNoteOpen(false);
    setNote("");
  }

  return (
    <main className="flex flex-col pb-10">
      <div className="flex flex-wrap items-center gap-3.5 px-7 pt-4">
        <h1 className="m-0 text-[46px] leading-[1.04] font-extrabold tracking-[-.035em]">Assistance</h1>
        <Pill tone="brand" className="h-7 px-3 text-[13px]">
          ● Live · {assistanceLessonFixture.label}
        </Pill>
        <span className="text-sm whitespace-nowrap text-ink2">
          {counts.online} online · {counts.idle} idle · {counts.offline} offline
        </span>
        <span className="ml-auto text-[13px] text-ink3">
          Shows who is connected now. Attendance is on Students.
        </span>
      </div>
      <PreviewBanner phase="Phase 9" className="mx-7 mt-3" />

      <div className="grid gap-[18px] px-7 pt-3.5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div
            role="region"
            aria-label="Help queue"
            className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-2xl bg-amb-s py-2 pr-3 pl-4"
          >
            <b className="text-sm font-bold whitespace-nowrap text-amb-i">Help queue</b>
            {queue.length === 0 && <span className="text-sm text-ink2">No one is waiting.</span>}
            {queue.map((q, i) => (
              <button
                key={q.loginCode}
                type="button"
                onClick={() => pick(q.loginCode)}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-amb px-3.5 text-sm font-bold whitespace-nowrap text-on-amb"
              >
                <span>
                  {i + 1}. {q.name}
                </span>
                <span className="text-[13px] font-medium">
                  {q.task} · {q.helpWaitMin} min
                </span>
              </button>
            ))}
            <span className="ml-auto text-[13px] whitespace-nowrap text-amb-i">Longest wait first</span>
          </div>

          <div className="rounded-[22px] bg-sf px-3.5 pt-3 pb-3.5">
            <div className="mx-auto mb-3 flex h-[26px] w-[46%] items-center justify-center rounded-full bg-sf2 text-xs font-bold tracking-[.06em] text-ink2">
              FRONT OF ROOM
            </div>
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_18px_repeat(3,minmax(0,1fr))] gap-x-2 gap-y-2.5">
              {seatsFixture.map((seat, index) => {
                const position = index % 6;
                const column = position < 3 ? position + 1 : position + 2;
                if (seat === null) {
                  return (
                    <div
                      key={`empty-${index}`}
                      style={{ gridColumn: column }}
                      className="grid h-[92px] place-items-center rounded-[14px] border-2 border-dashed border-ln text-xs text-ink3"
                    >
                      Empty seat
                    </div>
                  );
                }
                const help = needsHelp(seat);
                const selectedSeat = seat.loginCode === selected.loginCode;
                const [first, last] = seat.name.split(" ");
                const presence = presenceLabel[seat.presence];
                return (
                  <button
                    key={seat.loginCode}
                    type="button"
                    style={{ gridColumn: column }}
                    aria-pressed={selectedSeat}
                    aria-label={`${seat.name}, ${presence.text.slice(2)}${help ? ", needs help" : ""}`}
                    onClick={() => pick(seat.loginCode)}
                    className={cn(
                      "flex h-[92px] min-w-0 cursor-pointer flex-col items-stretch justify-between rounded-[14px] px-2.5 py-[7px] text-left text-xs leading-[1.3] text-ink",
                      selectedSeat
                        ? "border-2 border-ink"
                        : help
                          ? "border-2 border-amb"
                          : seat.presence === "offline"
                            ? "border-2 border-dashed border-bd"
                            : "border-2 border-transparent",
                      help ? "bg-amb-s" : seat.presence === "offline" ? "bg-transparent" : "bg-bg",
                    )}
                  >
                    <b className="truncate text-sm font-bold">
                      {first} {last?.[0]}.
                    </b>
                    {help ? (
                      <b className="self-start rounded-md bg-amb px-[7px] text-[11px] leading-[18px] font-extrabold text-on-amb">
                        HELP · {seat.helpWaitMin}m
                      </b>
                    ) : (
                      <b className={cn("text-xs font-semibold", presence.className)}>{presence.text}</b>
                    )}
                    <span className="truncate text-ink3">{seat.task}</span>
                    <span
                      className={cn(
                        "truncate",
                        seat.activity.startsWith("error") ? "text-cor-i" : "text-ink2",
                      )}
                    >
                      {seat.activity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside
          aria-label="Selected student"
          aria-live="polite"
          className="flex flex-col gap-2.5 self-start rounded-[24px] bg-sf px-[18px] py-4"
        >
          <div>
            <div className="flex justify-between gap-2 text-[13px] text-ink3">
              <span className="truncate">
                {assistanceLessonFixture.context} · {selected.task}
              </span>
              <Link href="/admin/review" className="font-bold whitespace-nowrap">
                Latest submission →
              </Link>
            </div>
            <h2 className="m-0 mt-0.5 flex items-baseline gap-2.5 text-[26px] leading-[1.15] font-extrabold tracking-[-.03em]">
              {selected.name}
              <span className="font-mono text-sm font-medium tracking-normal text-ink3">
                {selected.loginCode}
              </span>
            </h2>
          </div>
          <div className="flex min-h-[26px] items-center gap-2.5 text-sm whitespace-nowrap">
            <b className={cn("font-semibold", presenceLabel[selected.presence].className)}>
              {presenceLabel[selected.presence].text}
            </b>
            <span className="text-ink2">{selected.activity}</span>
            {needsHelp(selected) && (
              <b className="ml-auto rounded-full bg-amb px-[9px] text-xs leading-6 font-extrabold text-on-amb">
                HELP · {selected.helpWaitMin} min
              </b>
            )}
          </div>
          <div className="flex min-h-10 items-center gap-2 whitespace-nowrap">
            {isJoined ? (
              <>
                <span
                  role="status"
                  className="inline-flex h-10 items-center rounded-[10px] bg-vio-s px-3.5 text-sm font-bold text-vio-i"
                >
                  ● Joined
                </span>
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-bg"
                  onClick={() => setJoined((j) => ({ ...j, [selected.loginCode]: false }))}
                >
                  Leave
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="lg"
                disabled={offline}
                title={offline ? `${selectedFirst} is offline.` : undefined}
                onClick={() => setJoined((j) => ({ ...j, [selected.loginCode]: true }))}
              >
                Join {selectedFirst}’s work
              </Button>
            )}
            {needsHelp(selected) && (
              <Button
                size="lg"
                className="ml-auto bg-amb-s text-amb-i hover:bg-ln"
                onClick={() => setResolved((r) => ({ ...r, [selected.loginCode]: true }))}
              >
                Resolve help
              </Button>
            )}
          </div>

          <div className="scheme-dark overflow-hidden rounded-2xl bg-code-bg text-code-ink">
            <div className="flex h-10 items-center gap-2 bg-code-bar pr-2 pl-3 text-[13px] whitespace-nowrap">
              <b className="font-mono text-[13px] font-semibold">main.py</b>
              <span className="text-ink3">{offline ? "saved copy" : "live copy · synced"}</span>
              <Button
                variant="primary"
                size="sm"
                className="ml-auto h-7 rounded-lg text-[12.5px]"
                disabled
                title="Remote Run arrives in Phase 9."
              >
                ▶ Run
              </Button>
              <Button variant="secondary" size="sm" className="h-7 rounded-lg text-[12.5px]" disabled>
                ■ Stop
              </Button>
            </div>
            <CodeView
              code={code.code}
              label={`${selected.name}'s main.py`}
              className="h-[164px] py-2 text-[13px] leading-[18.5px]"
              cursors={offline ? [] : [{ line: code.cursorLine, label: selectedFirst, tone: "student" }]}
            />
            <div className="bg-code-bar px-3 pt-2 pb-2.5">
              <div className="text-xs font-bold whitespace-nowrap text-ink3">
                Output · last run by {selectedFirst} · v14
              </div>
              <pre className="m-0 mt-1 h-24 overflow-auto font-mono text-[12.5px] leading-4 font-medium whitespace-pre-wrap text-code-ink">
                {offline ? `No live output. ${selectedFirst} is offline.` : code.output}
              </pre>
            </div>
          </div>

          {noteOpen ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="guidance-note" className="text-sm font-bold">
                Note for {selectedFirst} <span className="font-medium text-ink3">· optional</span>
              </label>
              <div className="flex gap-2">
                <TextInput
                  id="guidance-note"
                  placeholder="Write a short note…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-w-0 flex-1 text-sm"
                />
                <Button variant="dark" size="lg" disabled title="Guidance notes arrive in Phase 9.">
                  Send
                </Button>
                <Button variant="ghost" size="lg" onClick={() => setNoteOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="secondary" className="h-[38px] bg-bg" onClick={() => setNoteOpen(true)}>
                + Add a written note
              </Button>
              <span className="text-[13px] text-ink3">Optional. Talking it through in class works too.</span>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
