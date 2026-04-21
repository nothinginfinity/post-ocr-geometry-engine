export type AmbiguityReason =
  | "low-ocr-confidence"
  | "sparse-word-count"
  | "heading-size-ambiguous"
  | "list-marker-uncertain"
  | "table-column-skew"
  | "table-single-row"
  | "code-low-symbol-density"
  | "code-indent-inconsistent"
  | "mixed-content-overlap";

export interface AmbiguityResult {
  level: "low" | "medium" | "high";
  reasons: AmbiguityReason[];
}

const REASON_SEVERITY: Record<AmbiguityReason, "low" | "medium" | "high"> = {
  "low-ocr-confidence": "medium",
  "sparse-word-count": "low",
  "heading-size-ambiguous": "low",
  "list-marker-uncertain": "medium",
  "table-column-skew": "high",
  "table-single-row": "medium",
  "code-low-symbol-density": "medium",
  "code-indent-inconsistent": "low",
  "mixed-content-overlap": "high",
};

export function rollupAmbiguity(reasons: AmbiguityReason[]): AmbiguityResult | undefined {
  if (reasons.length === 0) return undefined;
  const severities = reasons.map((r) => REASON_SEVERITY[r]);
  const level = severities.includes("high")
    ? "high"
    : severities.includes("medium")
    ? "medium"
    : "low";
  return { level, reasons };
}
