import type { Client, ComplianceFlag, ComplianceStatusValue, DocumentRecord } from './domain.js';

/** Shared request/response DTOs used by both apps/web and apps/api. */

export interface ClientWithStatus extends Client {
  compliance_status: ComplianceStatusValue;
  next_due_date: string | null;
  next_due_filing_type: string | null;
}

export interface DashboardSummary {
  totalClients: number;
  statusCounts: Record<ComplianceStatusValue, number>;
  upcomingDeadlines: Array<{
    clientId: string;
    clientName: string;
    filingType: string;
    dueDate: string;
  }>;
  recentAgentRuns: Array<{
    id: string;
    clientId: string | null;
    clientName: string | null;
    runType: string;
    status: string;
    startedAt: string;
  }>;
}

export interface RunComplianceAgentResponse {
  agentRunId: string;
  status: ComplianceStatusValue;
  flags: ComplianceFlag[];
  nextDueDate: string | null;
  nextDueFilingType: string | null;
  narrative: string;
}

export interface RagQueryRequest {
  clientId: string;
  question: string;
  documentId?: string;
}

export interface RagQueryResponse {
  answer: string;
  sources: Array<{
    chunkId: string;
    documentId: string;
    documentName: string;
    excerpt: string;
    similarity: number;
  }>;
  provider: string;
}

export interface DocumentStatusResponse {
  id: string;
  status: DocumentRecord['status'];
  errorMessage: string | null;
}

export interface AIStatusResponse {
  chatProvider: string;
  embeddingProvider: string;
  extractionProvider: string;
  mockMode: boolean;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  statusCode: number;
}
