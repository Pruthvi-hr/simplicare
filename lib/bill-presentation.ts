import type { MedicalBillAnalysis } from "@/lib/ai";

export function formatBillSummaryMessage(
  analysis: MedicalBillAnalysis,
): string {
  return [
    analysis.simplifiedSummary,
    "",
    `Amount due: ${analysis.amountDue}`,
    `Due date: ${analysis.dueDate}`,
    "",
    `Next step: ${analysis.nextSteps}`,
  ].join("\n");
}

export function buildSpeechScript(analysis: MedicalBillAnalysis): string {
  return `${analysis.simplifiedSummary} Amount due: ${analysis.amountDue}. Due date: ${analysis.dueDate}. ${analysis.nextSteps}`;
}
