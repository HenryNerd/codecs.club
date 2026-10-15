import { Pill } from "@/components/ui/Pill";
import type { CheckPart } from "@/lib/fixtures";

const outcomeLabel = {
  complete: { text: "✓ Completion", tone: "mint" as const },
  partial: { text: "◐ Partial completion", tone: "amber" as const },
  none: { text: "No completion", tone: "coral" as const },
};

/** Overall guided outcome plus the met / not-yet checklist. */
export function CheckResults({
  outcome,
  parts,
  partialMin,
}: {
  outcome: "complete" | "partial" | "none";
  parts: CheckPart[];
  partialMin: number;
}) {
  const met = parts.filter((p) => p.met).length;
  const label = outcomeLabel[outcome];
  return (
    <div className="flex flex-1 flex-col gap-2.5">
      <Pill tone={label.tone} className="h-7 px-3 text-[13px]">
        {label.text}
      </Pill>
      <ul className="m-0 grid list-none grid-cols-[78px_1fr] items-baseline gap-x-2.5 gap-y-1.5 p-0 text-sm">
        {parts.map((part) => (
          <li key={part.name} className="contents">
            <b className={part.met ? "text-xs font-bold text-mint-i" : "text-xs font-bold text-cor-i"}>
              {part.met ? "✓ Met" : "✕ Not yet"}
            </b>
            <span>
              {part.name}
              {part.detail && <span className="text-[12.5px] text-ink3"> · {part.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
      <span className="mt-auto text-[12.5px] text-ink2">
        {explainOutcome(outcome, met, parts.length, partialMin)}
      </span>
    </div>
  );
}

export function explainOutcome(
  outcome: "complete" | "partial" | "none",
  met: number,
  total: number,
  partialMin: number,
): string {
  if (outcome === "complete") return `All ${total} parts met.`;
  if (outcome === "partial") {
    const left = total - met;
    return `${met} of ${total} parts met, enough for partial. Fix the last ${left === 1 ? "part" : `${left} parts`} for completion.`;
  }
  return `${met} of ${total} parts met. Partial needs ${partialMin}.`;
}
