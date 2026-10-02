import { z } from "zod";

export const AGENT_IDS = ["market", "portfolio", "research", "risk"] as const;

export const AgentIdSchema = z.enum(AGENT_IDS);

export type AgentId = z.infer<typeof AgentIdSchema>;
