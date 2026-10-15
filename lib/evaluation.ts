/**
 * Guided-evaluation rules shared by the assignment editor and (later) the
 * checker. Output comparison ignores all whitespace (spaces, tabs, line
 * breaks) while keeping the order of everything else.
 */
export type PartKind = "begins" | "containsInOrder" | "ends" | "equals";

export const partKindLabel: Record<PartKind, string> = {
  begins: "Output begins with",
  containsInOrder: "Output contains, in order",
  ends: "Output ends with",
  equals: "Output equals",
};

export function stripWhitespace(text: string): string {
  return text.replace(/\s+/g, "");
}

/** Whether a partial-completion minimum makes sense for this many parts. */
export function validatePartialRule(
  partCount: number,
  partialMin: number,
): { ok: true; message: string } | { ok: false; message: string } {
  if (partCount === 0) return { ok: false, message: "Add at least one part to check." };
  if (partCount === 1) {
    return { ok: true, message: "One part: the work is either complete or not." };
  }
  if (partialMin < 1) return { ok: false, message: "Partial completion needs at least 1 part." };
  if (partialMin >= partCount) {
    return {
      ok: false,
      message: `Partial must need fewer than all ${partCount} parts, or it equals completion.`,
    };
  }
  return { ok: true, message: `Reachable. Completion still needs all ${partCount}.` };
}
