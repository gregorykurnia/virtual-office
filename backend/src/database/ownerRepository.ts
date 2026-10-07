import {
  FieldPath,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot
} from "firebase-admin/firestore";
import {
  AgentDocumentSchema,
  InputSnapshotDocumentSchema,
  ReportDocumentSchema,
  ReportReadDocumentSchema,
  ReportSourceDocumentSchema,
  RunDocumentSchema,
  RunInputDocumentSchema,
  TaskDocumentSchema,
  type AgentDocument,
  type ReportDocument,
  type RunDocument,
  type TaskDocument
} from "@investment-office/shared";
import type { VerifiedOwnerContext } from "../auth/ownerAuth.js";
import { ApiError, corruptRecord, notFound } from "../api/errors.js";
import {
  AgentApiSchema,
  AgentProfileApiSchema,
  ConnectionApiSchema,
  ReportApiSchema,
  ReportDetailApiSchema,
  ReportSourceApiSchema,
  RunApiSchema,
  TaskApiSchema,
  type AgentApi,
  type AgentProfileApi,
  type ConnectionApi,
  type ReportApi,
  type ReportDetailApi,
  type ReportPageApi,
  type RunApi,
  type RunPageApi,
  type TaskApi
} from "../api/contracts.js";
import { ownerCollection, ownerRecord } from "./paths.js";

const REPORT_SCAN_LIMIT = 250;
const PAGE_SCAN_SIZE = 50;
const AGENT_TASK_LIMIT = 20;
const AGENT_REPORT_LIMIT = 5;
const MAX_SOURCES_PER_REPORT = 100;

type CursorPosition = { timestamp: Timestamp; id: string };
type IdentifiedRun = { id: string; data: RunDocument };
type IdentifiedReport = { id: string; data: ReportDocument };

function timestampIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  if (typeof value === "object" && value !== null && "seconds" in value && "nanoseconds" in value
    && typeof value.seconds === "number" && typeof value.nanoseconds === "number") {
    return new Timestamp(value.seconds, value.nanoseconds).toDate().toISOString();
  }
  throw corruptRecord();
}

function nullableTimestampIso(value: unknown): string | null {
  return value === null ? null : timestampIso(value);
}

function parseSnapshot<T>(snapshot: DocumentSnapshot, schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }): T {
  if (!snapshot.exists) throw notFound();
  const parsed = schema.safeParse(snapshot.data());
  if (!parsed.success) throw corruptRecord();
  return parsed.data;
}

function parseQuerySnapshot<T>(snapshot: QueryDocumentSnapshot, schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }): T {
  const parsed = schema.safeParse(snapshot.data());
  if (!parsed.success) throw corruptRecord();
  return parsed.data;
}

function encodeCursor(position: CursorPosition, scope: string): string {
  return Buffer.from(JSON.stringify({
    seconds: position.timestamp.seconds,
    nanoseconds: position.timestamp.nanoseconds,
    id: position.id,
    scope
  })).toString("base64url");
}

function decodeCursor(value: string | undefined, scope: string): CursorPosition | null {
  if (!value) return null;
  try {
    const decoded = Buffer.from(value, "base64url");
    if (!value || decoded.toString("base64url") !== value) throw new Error("Invalid cursor encoding.");
    const parsed: unknown = JSON.parse(decoded.toString("utf8"));
    if (typeof parsed !== "object" || parsed === null || !("seconds" in parsed) || !("nanoseconds" in parsed) || !("id" in parsed)
      || typeof parsed.seconds !== "number" || !Number.isInteger(parsed.seconds)
      || typeof parsed.nanoseconds !== "number" || !Number.isInteger(parsed.nanoseconds)
      || parsed.nanoseconds < 0 || parsed.nanoseconds > 999_999_999
      || typeof parsed.id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(parsed.id)
      || !("scope" in parsed) || parsed.scope !== scope) {
      throw new Error("Invalid cursor shape.");
    }
    return { timestamp: new Timestamp(parsed.seconds, parsed.nanoseconds), id: parsed.id };
  } catch {
    throw new ApiError(422, "invalid_cursor", "The page cursor is invalid.");
  }
}

function positionFromSnapshot(snapshot: QueryDocumentSnapshot, field: string): CursorPosition {
  const value = snapshot.get(field);
  if (!(value instanceof Timestamp)) throw corruptRecord();
  return { timestamp: value, id: snapshot.id };
}

function dateQueryValue(value: string): Timestamp {
  return Timestamp.fromDate(new Date(value));
}

function humanizeDefinition(value: string): string {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapAgentDocument(id: string, agent: AgentDocument, activeRun: IdentifiedRun | null, latestRun: RunDocument | null): AgentApi {
  const activeRunId = activeRun?.data.executionStatus === "running" || activeRun?.data.executionStatus === "queued"
    ? activeRun.id
    : null;
  const status = activeRun?.data.executionStatus === "running"
    ? "working"
    : activeRun?.data.executionStatus === "queued"
      ? "waiting"
      : "unknown";
  const statusLabel = status === "working"
    ? "Working · app run active"
    : status === "waiting"
      ? "Waiting · app run queued"
      : latestRun
        ? `Unknown · last observed ${timestampIso(latestRun.observedAt)}`
        : "Unknown · no run observation";
  return AgentApiSchema.parse({
    ...agent,
    id,
    createdAt: timestampIso(agent.createdAt),
    updatedAt: timestampIso(agent.updatedAt),
    availability: {
      status,
      statusLabel,
      activeRunId,
      lastObservedAt: latestRun ? timestampIso(latestRun.observedAt) : null
    }
  });
}

function mapTask(id: string, task: TaskDocument): TaskApi {
  return TaskApiSchema.parse({
    ...task,
    id,
    name: task.name ?? humanizeDefinition(task.definitionKey),
    purpose: task.purpose ?? "Purpose is not recorded for this task.",
    inputs: task.inputs ?? [],
    missingInputs: task.missingInputs ?? ["Input requirements have not been configured for this task."],
    updatedAt: timestampIso(task.updatedAt),
    observedNextRunAt: nullableTimestampIso(task.observedNextRunAt)
  });
}

function mapRun(id: string, run: RunDocument): RunApi {
  return RunApiSchema.parse({
    ...run,
    id,
    queuedAt: timestampIso(run.queuedAt),
    startedAt: nullableTimestampIso(run.startedAt),
    endedAt: nullableTimestampIso(run.endedAt),
    observedAt: timestampIso(run.observedAt)
  });
}

type ReadState = { readAt: string | null };

function parseReadState(snapshot: DocumentSnapshot, reportId: string): ReadState {
  if (!snapshot.exists) return { readAt: null };
  const value = parseSnapshot(snapshot, ReportReadDocumentSchema);
  if (value.reportId !== reportId) throw corruptRecord();
  return { readAt: timestampIso(value.readAt) };
}

export class OwnerRepository {
  constructor(private readonly db: Firestore, private readonly owner: VerifiedOwnerContext) {}

  private async loadAgentRuns(agentId: string): Promise<{ active: IdentifiedRun | null; latest: RunDocument | null }> {
    const runs = ownerCollection(this.db, this.owner, "runs");
    const [activeSnapshot, latestSnapshot] = await Promise.all([
      runs.where("agentId", "==", agentId)
        .where("executionStatus", "in", ["queued", "running"])
        .orderBy("observedAt", "desc")
        .limit(1)
        .get(),
      runs.where("agentId", "==", agentId).orderBy("observedAt", "desc").limit(1).get()
    ]);
    const active = activeSnapshot.empty ? null : {
      id: activeSnapshot.docs[0]!.id,
      data: parseQuerySnapshot(activeSnapshot.docs[0]!, RunDocumentSchema)
    };
    const latest = latestSnapshot.empty ? null : parseQuerySnapshot(latestSnapshot.docs[0]!, RunDocumentSchema);
    if ((active && active.data.agentId !== agentId) || (latest && latest.agentId !== agentId)) throw corruptRecord();
    return { active, latest };
  }

  private async loadAgentApi(id: string, agent: AgentDocument): Promise<AgentApi> {
    if (agent.roleKey !== id) throw corruptRecord();
    const runs = await this.loadAgentRuns(id);
    if (runs.active && runs.active.data.agentId !== id) throw corruptRecord();
    return mapAgentDocument(id, agent, runs.active, runs.latest);
  }

  private async loadReportParents(reports: IdentifiedReport[]): Promise<Map<string, RunDocument>> {
    const agentIds = [...new Set(reports.map(({ data }) => data.agentId))];
    const taskIds = [...new Set(reports.map(({ data }) => data.taskId))];
    const runIds = [...new Set(reports.map(({ data }) => data.runId))];
    if (reports.length === 0) return new Map();
    const [agents, tasks, runs] = await Promise.all([
      this.db.getAll(...agentIds.map((id) => ownerRecord(this.db, this.owner, "agents", id))),
      this.db.getAll(...taskIds.map((id) => ownerRecord(this.db, this.owner, "tasks", id))),
      this.db.getAll(...runIds.map((id) => ownerRecord(this.db, this.owner, "runs", id)))
    ]);
    const agentById = new Map<string, AgentDocument>();
    const taskById = new Map<string, TaskDocument>();
    const runById = new Map<string, RunDocument>();
    agents.forEach((snapshot, index) => agentById.set(agentIds[index]!, parseSnapshot(snapshot, AgentDocumentSchema)));
    tasks.forEach((snapshot, index) => taskById.set(taskIds[index]!, parseSnapshot(snapshot, TaskDocumentSchema)));
    runs.forEach((snapshot, index) => runById.set(runIds[index]!, parseSnapshot(snapshot, RunDocumentSchema)));
    const reportRunById = new Map<string, RunDocument>();
    for (const { id, data } of reports) {
      const agent = agentById.get(data.agentId);
      const task = taskById.get(data.taskId);
      const run = runById.get(data.runId);
      if (!agent || !task || !run || agent.roleKey !== data.agentId || task.agentId !== data.agentId
        || run.agentId !== data.agentId || run.taskId !== data.taskId || run.reportId !== id) {
        throw corruptRecord();
      }
      reportRunById.set(id, run);
    }
    return reportRunById;
  }

  async listAgents(): Promise<AgentApi[]> {
    const snapshot = await ownerCollection(this.db, this.owner, "agents")
      .orderBy(FieldPath.documentId(), "asc").limit(4).get();
    const agents = snapshot.docs.map((doc) => ({
      id: doc.id,
      agent: parseQuerySnapshot(doc, AgentDocumentSchema)
    }));
    return Promise.all(agents.map(({ id, agent }) => this.loadAgentApi(id, agent)));
  }

  async getAgentProfile(id: string): Promise<AgentProfileApi | null> {
    const agentSnapshot = await ownerRecord(this.db, this.owner, "agents", id).get();
    if (!agentSnapshot.exists) return null;
    const agent = parseSnapshot(agentSnapshot, AgentDocumentSchema);
    const tasksCollection = ownerCollection(this.db, this.owner, "tasks");
    const reportsCollection = ownerCollection(this.db, this.owner, "reports");
    const [agentApi, taskSnapshot, reportSnapshot] = await Promise.all([
      this.loadAgentApi(id, agent),
      tasksCollection.where("agentId", "==", id).orderBy("updatedAt", "desc").limit(AGENT_TASK_LIMIT).get(),
      reportsCollection.where("agentId", "==", id).orderBy("generatedAt", "desc").limit(AGENT_REPORT_LIMIT).get()
    ]);

    const tasks = taskSnapshot.docs.map((doc) => {
      const task = parseQuerySnapshot(doc, TaskDocumentSchema);
      if (task.agentId !== id) throw corruptRecord();
      return mapTask(doc.id, task);
    });
    const parsedReports = reportSnapshot.docs.map((doc) => ({
      id: doc.id,
      data: parseQuerySnapshot(doc, ReportDocumentSchema)
    }));
    const [readSnapshots, reportRunById] = parsedReports.length > 0
      ? await Promise.all([
        this.db.getAll(...parsedReports.map(({ id }) => ownerRecord(this.db, this.owner, "reportReads", id))),
        this.loadReportParents(parsedReports)
      ])
      : [[], new Map<string, RunDocument>()];
    const latestReports = parsedReports.map(({ id, data }, index) => {
      if (data.agentId !== agent.roleKey) throw corruptRecord();
      const run = reportRunById.get(id);
      if (!run) throw corruptRecord();
      const readState = parseReadState(readSnapshots[index]!, id);
      return ReportApiSchema.parse({
        ...data,
        id,
        generatedAt: timestampIso(data.generatedAt),
        dataAsOf: nullableTimestampIso(data.dataAsOf),
        readAt: readState.readAt,
        processingStatus: run.processingStatus
      });
    });
    const missingInputs = [...new Set(tasks.flatMap((task) => task.missingInputs))];
    return AgentProfileApiSchema.parse({ agent: agentApi, tasks, latestReports, missingInputs });
  }

  async listReports(args: {
    agentId?: string | undefined;
    unreadOnly?: boolean | undefined;
    query?: string | undefined;
    generatedFrom?: string | undefined;
    generatedTo?: string | undefined;
    pageSize: number;
    cursor?: string | undefined;
  }): Promise<ReportPageApi> {
    const cursorScope = JSON.stringify({
      kind: "reports",
      agentId: args.agentId ?? null,
      unreadOnly: args.unreadOnly ?? false,
      query: args.query?.trim().toLocaleLowerCase() ?? null,
      generatedFrom: args.generatedFrom ?? null,
      generatedTo: args.generatedTo ?? null
    });
    const cursor = decodeCursor(args.cursor, cursorScope);
    const collection = ownerCollection(this.db, this.owner, "reports");
    let query: Query<DocumentData> = collection
      .orderBy("generatedAt", "desc")
      .orderBy(FieldPath.documentId(), "desc");
    if (args.agentId) query = query.where("agentId", "==", args.agentId);
    if (args.generatedFrom) query = query.where("generatedAt", ">=", dateQueryValue(args.generatedFrom));
    if (args.generatedTo) query = query.where("generatedAt", "<=", dateQueryValue(args.generatedTo));

    const matches: Array<{ report: ReportApi; position: CursorPosition }> = [];
    let scanned = 0;
    let scanCursor = cursor;
    let exhausted = false;

    while (matches.length <= args.pageSize && scanned < REPORT_SCAN_LIMIT && !exhausted) {
      const batchSize = Math.min(PAGE_SCAN_SIZE, REPORT_SCAN_LIMIT - scanned);
      let batchQuery = query;
      if (scanCursor) batchQuery = batchQuery.startAfter(scanCursor.timestamp, scanCursor.id);
      const batch = await batchQuery.limit(batchSize).get();
      if (batch.empty) {
        exhausted = true;
        break;
      }
      scanned += batch.docs.length;
      const parsed = batch.docs.map((doc) => ({
        id: doc.id,
        data: parseQuerySnapshot(doc, ReportDocumentSchema),
        position: positionFromSnapshot(doc, "generatedAt")
      }));
      const [readSnapshots, reportRunById] = await Promise.all([
        this.db.getAll(...parsed.map(({ id }) => ownerRecord(this.db, this.owner, "reportReads", id))),
        this.loadReportParents(parsed)
      ]);

      for (let index = 0; index < parsed.length; index += 1) {
        const entry = parsed[index]!;
        scanCursor = entry.position;
        const readState = parseReadState(readSnapshots[index]!, entry.id);
        if (args.unreadOnly && readState.readAt !== null) continue;
        const needle = args.query?.toLocaleLowerCase().trim();
        if (needle && !`${entry.data.title}\n${entry.data.summary}`.toLocaleLowerCase().includes(needle)) continue;
        const run = reportRunById.get(entry.id);
        if (!run) throw corruptRecord();
        matches.push({ report: ReportApiSchema.parse({
          ...entry.data,
          id: entry.id,
          generatedAt: timestampIso(entry.data.generatedAt),
          dataAsOf: nullableTimestampIso(entry.data.dataAsOf),
          readAt: readState.readAt,
          processingStatus: run.processingStatus
        }), position: entry.position });
        if (matches.length > args.pageSize) break;
      }
      if (batch.docs.length < batchSize) exhausted = true;
    }

    const hasExtraMatch = matches.length > args.pageSize;
    const page = matches.slice(0, args.pageSize);
    const scanLimitReached = scanned >= REPORT_SCAN_LIMIT && !exhausted;
    const hasMore = hasExtraMatch || scanLimitReached;
    const nextPosition = hasExtraMatch
      ? page.at(-1)?.position ?? null
      : scanLimitReached ? scanCursor : null;
    return {
      items: page.map(({ report }) => report),
      nextCursor: hasMore && nextPosition ? encodeCursor(nextPosition, cursorScope) : null,
      hasMore
    };
  }

  async getReportDetail(id: string): Promise<ReportDetailApi | null> {
    const reportSnapshot = await ownerRecord(this.db, this.owner, "reports", id).get();
    if (!reportSnapshot.exists) return null;
    const report = parseSnapshot(reportSnapshot, ReportDocumentSchema);
    const agentRef = ownerRecord(this.db, this.owner, "agents", report.agentId);
    const taskRef = ownerRecord(this.db, this.owner, "tasks", report.taskId);
    const runRef = ownerRecord(this.db, this.owner, "runs", report.runId);
    const readRef = ownerRecord(this.db, this.owner, "reportReads", id);
    const sourcesQuery = ownerCollection(this.db, this.owner, "reportSources")
      .where("reportId", "==", id).orderBy("sourceKey", "asc").limit(MAX_SOURCES_PER_REPORT + 1);
    const [parentSnapshots, readSnapshot, sourcesSnapshot] = await Promise.all([
      this.db.getAll(agentRef, taskRef, runRef),
      readRef.get(),
      sourcesQuery.get()
    ]);
    if (sourcesSnapshot.docs.length > MAX_SOURCES_PER_REPORT) throw corruptRecord();
    const agent = parseSnapshot(parentSnapshots[0]!, AgentDocumentSchema);
    const task = parseSnapshot(parentSnapshots[1]!, TaskDocumentSchema);
    const run = parseSnapshot(parentSnapshots[2]!, RunDocumentSchema);
    if (agent.roleKey !== report.agentId || task.agentId !== report.agentId
      || run.agentId !== report.agentId || run.taskId !== report.taskId || run.reportId !== id) {
      throw corruptRecord();
    }
    const readState = parseReadState(readSnapshot, id);
    const sources = sourcesSnapshot.docs.map((doc) => {
      const source = parseQuerySnapshot(doc, ReportSourceDocumentSchema);
      if (source.reportId !== id) throw corruptRecord();
      return ReportSourceApiSchema.parse({
        ...source,
        id: doc.id,
        publishedAt: nullableTimestampIso(source.publishedAt),
        retrievedAt: nullableTimestampIso(source.retrievedAt),
        asOf: nullableTimestampIso(source.asOf)
      });
    });

    let inputSnapshot: ReportDetailApi["inputSnapshot"] = null;
    const runInputSnapshot = await ownerRecord(this.db, this.owner, "runInputs", report.runId).get();
    if (runInputSnapshot.exists) {
      const runInput = parseSnapshot(runInputSnapshot, RunInputDocumentSchema);
      if (runInput.runId !== report.runId) throw corruptRecord();
      const snapshotRef = ownerRecord(this.db, this.owner, "inputSnapshots", runInput.snapshotId);
      const inputSnapshotDoc = await snapshotRef.get();
      const input = parseSnapshot(inputSnapshotDoc, InputSnapshotDocumentSchema);
      inputSnapshot = {
        id: runInput.snapshotId,
        inputVersion: runInput.inputVersion,
        createdAt: timestampIso(input.createdAt),
        asOf: timestampIso(input.asOf),
        contentHash: input.contentHash
      };
    }

    return ReportDetailApiSchema.parse({
      report: {
        ...report,
        id,
        generatedAt: timestampIso(report.generatedAt),
        dataAsOf: nullableTimestampIso(report.dataAsOf),
        readAt: readState.readAt,
        processingStatus: run.processingStatus
      },
      sources,
      run: mapRun(report.runId, run),
      inputSnapshot
    });
  }

  async markReportRead(id: string): Promise<{ reportId: string; readAt: string }> {
    const reportRef = ownerRecord(this.db, this.owner, "reports", id);
    const readRef = ownerRecord(this.db, this.owner, "reportReads", id);
    const now = Timestamp.now();
    const readAt = await this.db.runTransaction(async (transaction) => {
      const [reportSnapshot, existingRead] = await Promise.all([
        transaction.get(reportRef),
        transaction.get(readRef)
      ]);
      const report = parseSnapshot(reportSnapshot, ReportDocumentSchema);
      const parents = await Promise.all([
        transaction.get(ownerRecord(this.db, this.owner, "agents", report.agentId)),
        transaction.get(ownerRecord(this.db, this.owner, "tasks", report.taskId)),
        transaction.get(ownerRecord(this.db, this.owner, "runs", report.runId))
      ]);
      const agent = parseSnapshot(parents[0]!, AgentDocumentSchema);
      const task = parseSnapshot(parents[1]!, TaskDocumentSchema);
      const run = parseSnapshot(parents[2]!, RunDocumentSchema);
      if (agent.roleKey !== report.agentId || task.agentId !== report.agentId
        || run.agentId !== report.agentId || run.taskId !== report.taskId || run.reportId !== id) {
        throw corruptRecord();
      }
      if (existingRead.exists) {
        const prior = parseSnapshot(existingRead, ReportReadDocumentSchema);
        if (prior.reportId !== id) throw corruptRecord();
        return prior.readAt;
      }
      transaction.create(readRef, { reportId: id, readAt: now });
      return now;
    });
    return { reportId: id, readAt: timestampIso(readAt) };
  }

  async listRuns(args: { agentId?: string | undefined; taskId?: string | undefined; pageSize: number; cursor?: string | undefined }): Promise<RunPageApi> {
    const cursorScope = JSON.stringify({ kind: "runs", agentId: args.agentId ?? null, taskId: args.taskId ?? null });
    const cursor = decodeCursor(args.cursor, cursorScope);
    let query: Query<DocumentData> = ownerCollection(this.db, this.owner, "runs")
      .orderBy("queuedAt", "desc")
      .orderBy(FieldPath.documentId(), "desc");
    if (args.agentId) query = query.where("agentId", "==", args.agentId);
    if (args.taskId) query = query.where("taskId", "==", args.taskId);
    if (cursor) query = query.startAfter(cursor.timestamp, cursor.id);
    const page = await query.limit(args.pageSize + 1).get();
    const hasMore = page.docs.length > args.pageSize;
    const docs = page.docs.slice(0, args.pageSize);
    const runs = docs.map((doc) => ({ id: doc.id, run: parseQuerySnapshot(doc, RunDocumentSchema) }));
    await this.validateRunRelationships(runs);
    const items = runs.map(({ id, run }) => mapRun(id, run));
    const lastDoc = docs.at(-1);
    return {
      items,
      nextCursor: hasMore && lastDoc ? encodeCursor(positionFromSnapshot(lastDoc, "queuedAt"), cursorScope) : null,
      hasMore
    };
  }

  async getRun(id: string): Promise<RunApi | null> {
    const snapshot = await ownerRecord(this.db, this.owner, "runs", id).get();
    if (!snapshot.exists) return null;
    const run = parseSnapshot(snapshot, RunDocumentSchema);
    await this.validateRunRelationships([{ id, run }]);
    return mapRun(id, run);
  }

  async getConnection(): Promise<ConnectionApi> {
    return ConnectionApiSchema.parse({
      status: "unknown",
      available: false,
      stale: true,
      lastSuccessfulCheckAt: null,
      capabilities: [],
      integration: null
    });
  }

  private async validateRunRelationships(runs: Array<{ id: string; run: RunDocument }>): Promise<void> {
    if (runs.length === 0) return;
    const agentIds = [...new Set(runs.map(({ run }) => run.agentId))];
    const taskIds = [...new Set(runs.map(({ run }) => run.taskId))];
    const reportIds = [...new Set(runs.flatMap(({ run }) => run.reportId ? [run.reportId] : []))];
    const [agents, tasks, reports] = await Promise.all([
      this.db.getAll(...agentIds.map((id) => ownerRecord(this.db, this.owner, "agents", id))),
      this.db.getAll(...taskIds.map((id) => ownerRecord(this.db, this.owner, "tasks", id))),
      reportIds.length > 0
        ? this.db.getAll(...reportIds.map((id) => ownerRecord(this.db, this.owner, "reports", id)))
        : Promise.resolve([])
    ]);
    const agentById = new Map<string, AgentDocument>();
    const taskById = new Map<string, TaskDocument>();
    const reportById = new Map<string, ReportDocument>();
    agents.forEach((snapshot, index) => agentById.set(agentIds[index]!, parseSnapshot(snapshot, AgentDocumentSchema)));
    tasks.forEach((snapshot, index) => taskById.set(taskIds[index]!, parseSnapshot(snapshot, TaskDocumentSchema)));
    reports.forEach((snapshot, index) => reportById.set(reportIds[index]!, parseSnapshot(snapshot, ReportDocumentSchema)));
    for (const { id, run } of runs) {
      const agent = agentById.get(run.agentId);
      const task = taskById.get(run.taskId);
      if (!agent || !task || agent.roleKey !== run.agentId || task.agentId !== run.agentId) throw corruptRecord();
      if (run.reportId) {
        const report = reportById.get(run.reportId);
        if (!report || report.runId !== id || report.agentId !== run.agentId || report.taskId !== run.taskId) {
          throw corruptRecord();
        }
      }
    }
  }
}
