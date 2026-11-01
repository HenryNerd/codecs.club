"use client";

import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useRef, useState } from "react";
import { Pill } from "@/components/ui/Pill";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { errorMessage } from "@/lib/errors";
import { formatShortDate, formatTime, formatWeekdayDateTime, isSameDay } from "@/lib/format";
import { useNow } from "@/lib/useNow";
import type { WorkspaceSync } from "@/lib/workspaceSync";

function newKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Turn in: saves, then has Convex snapshot the saved files as the next
 * attempt. Shows the latest attempt, its review and the teacher's feedback.
 * After the close, editing, Versions and feedback stay available.
 */
export function TurnInCard({
  workspaceId,
  timeZone,
  sync,
}: {
  workspaceId: Id<"workspaces">;
  timeZone: string;
  sync: WorkspaceSync;
}) {
  const status = useQuery(api.submissions.forWorkspace, { workspaceId });
  const turnIn = useMutation(api.submissions.turnIn);
  const now = useNow(60_000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  // Kept until the server answers, so a retry after a dropped connection
  // can't turn in twice.
  const pendingKey = useRef<string | null>(null);

  const closesAt = status?.closesAt ?? null;
  const closed = closesAt !== null && now >= closesAt;
  const latest = status?.latest ?? null;
  const feedback = status?.feedback ?? null;

  const submit = async () => {
    setError(null);
    setConfirmation(null);
    setBusy(true);
    try {
      try {
        await sync.flush();
      } catch {
        setError("Your latest changes haven’t saved, so nothing was turned in. Try again once they save.");
        return;
      }
      pendingKey.current ??= newKey();
      const result = await turnIn({ workspaceId, idempotencyKey: pendingKey.current });
      pendingKey.current = null;
      setConfirmation(`Turned in v${result.versionNumber} as attempt ${result.attempt}. You can keep editing.`);
    } catch (e) {
      // The server answered (e.g. turn-in closed), so the next click is a new turn-in.
      if (e instanceof ConvexError) pendingKey.current = null;
      setError(errorMessage(e, "Couldn’t turn in. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  };

  const when = (ts: number) =>
    isSameDay(ts, now, timeZone) ? `today, ${formatTime(ts, timeZone)}` : formatWeekdayDateTime(ts, timeZone);

  return (
    <div className="m-2.5 mt-0 flex flex-none flex-col gap-2.5 rounded-2xl bg-bg px-4 pt-3.5 pb-4">
      <div className="flex items-baseline justify-between gap-2">
        <b className="font-bold whitespace-nowrap">{latest ? "Turned in" : "Not turned in"}</b>
        <span className="text-[13px] whitespace-nowrap text-ink3">
          {status === undefined
            ? null
            : closesAt === null
              ? "Not scheduled"
              : `${closed ? "Closed" : "Closes"} ${formatWeekdayDateTime(closesAt, timeZone)}`}
        </span>
      </div>
      {latest?.reviewDecision && <Pill tone={latest.reviewDecision === "needsWork" ? "coral" : "mint"}>{latest.reviewDecision === "needsWork" ? "Needs Work" : "Done"}</Pill>}
      {latest && (
        <span role="status" className="-mt-1 text-[13px] text-ink2">
          Attempt {latest.attempt} · v{latest.versionNumber} · {when(latest.submittedAt)} ·{" "}
          {latest.status === "reviewed" ? (
            <b className="font-bold text-vio-i">
              {latest.reviewDecision === "needsWork" ? "Needs Work" : latest.reviewDecision === "complete" ? "Done" : "Reviewed"}{latest.reviewerName ? ` by ${latest.reviewerName}` : ""}
              {latest.reviewedAt ? ` · ${formatShortDate(latest.reviewedAt, timeZone)}` : ""}
            </b>
          ) : (
            "waiting for review"
          )}
        </span>
      )}
      {feedback && (
        <div className="flex max-h-[132px] flex-col gap-1 overflow-auto rounded-xl bg-vio-s px-3 py-2.5">
          <b className="flex items-center gap-2 text-[13px] font-bold text-vio-i">
            <Avatar name={feedback.authorName} tone="violet" size={20} className="text-[8px]" />
            {feedback.authorName}
            <span className="font-medium">
              · on attempt {feedback.attempt}
              {latest && feedback.attempt !== latest.attempt ? " (earlier)" : ""}
            </span>
          </b>
          <p className="m-0 text-sm whitespace-pre-line">{feedback.body}</p>
        </div>
      )}
      <Button
        variant="primary"
        className="h-[46px] w-full rounded-xl text-base"
        disabled={status === undefined || closed || busy}
        loading={busy}
        loadingLabel="Turning in…"
        onClick={() => void submit()}
      >
        {latest ? "Turn in again" : "Turn in"}
      </Button>
      {error ? (
        <span role="alert" className="text-[12.5px] font-semibold text-cor-i">
          {error}
        </span>
      ) : confirmation ? (
        <span role="status" className="text-[12.5px] font-semibold text-mint-i">
          ✓ {confirmation}
        </span>
      ) : closed ? (
        <span className="text-[12.5px] text-ink3">
          Turn-in has closed. Your work is still saved: you can keep editing, see your versions and read feedback.
        </span>
      ) : null}
    </div>
  );
}
