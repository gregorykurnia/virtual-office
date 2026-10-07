import type { DeliveryStatus, ExecutionStatus, ReportProcessingStatus } from "./contracts.js";

const EXECUTION_TRANSITIONS: Record<ExecutionStatus, readonly ExecutionStatus[]> = {
  queued: ["queued", "running", "failed", "cancelled", "interrupted", "skipped", "unknown"],
  running: ["running", "succeeded", "failed", "cancelled", "interrupted", "unknown"],
  succeeded: ["succeeded"],
  failed: ["failed"],
  cancelled: ["cancelled"],
  interrupted: ["interrupted"],
  skipped: ["skipped"],
  unknown: ["unknown", "queued", "running", "succeeded", "failed", "cancelled", "interrupted", "skipped"]
};

const DELIVERY_TRANSITIONS: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
  pending: ["pending", "delivered", "failed", "unknown"],
  delivered: ["delivered"],
  failed: ["failed"],
  unknown: ["unknown", "pending", "delivered", "failed"]
};

const REPORT_PROCESSING_TRANSITIONS: Record<ReportProcessingStatus, readonly ReportProcessingStatus[]> = {
  pending: ["pending", "processed", "failed"],
  processed: ["processed"],
  failed: ["failed"]
};

export function canTransitionExecutionStatus(from: ExecutionStatus, to: ExecutionStatus): boolean {
  return EXECUTION_TRANSITIONS[from].includes(to);
}

export function canTransitionDeliveryStatus(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return DELIVERY_TRANSITIONS[from].includes(to);
}

export function canTransitionReportProcessingStatus(
  from: ReportProcessingStatus,
  to: ReportProcessingStatus
): boolean {
  return REPORT_PROCESSING_TRANSITIONS[from].includes(to);
}
