export type ClientType = 'individual' | 'proprietorship' | 'partnership' | 'llp' | 'company';

export type FilingCategory = 'GST' | 'TDS' | 'ITR';
export type FilingFrequency = 'monthly' | 'quarterly' | 'annually';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export type DocumentType = 'invoice' | 'ledger' | 'financial_statement' | 'other';
export type DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

export type ComplianceStatusValue = 'on_track' | 'due_soon' | 'overdue' | 'missing_docs';

export type AgentRunType = 'compliance_check' | 'document_extraction' | 'rag_query';
export type AgentRunStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Profile {
  id: string;
  firm_name: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  owner_id: string;
  name: string;
  client_type: ClientType;
  pan: string | null;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilingType {
  id: string;
  code: string;
  name: string;
  category: FilingCategory;
  frequency: FilingFrequency;
  description: string | null;
  created_at: string;
}

export interface ClientFiling {
  id: string;
  owner_id: string;
  client_id: string;
  filing_type_id: string;
  frequency_override: FilingFrequency | null;
  is_active: boolean;
  created_at: string;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface Task {
  id: string;
  owner_id: string;
  client_id: string;
  client_filing_id: string;
  period_label: string;
  due_date: string;
  status: TaskStatus;
  checklist: ChecklistItem[];
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedField {
  field: string;
  value: string | number | null;
  confidence: number;
  sourceExcerpt?: string;
}

export interface DocumentRecord {
  id: string;
  owner_id: string;
  client_id: string;
  task_id: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  doc_type: DocumentType;
  status: DocumentStatus;
  extracted_summary: { fields: ExtractedField[] } | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  owner_id: string;
  client_id: string;
  chunk_index: number;
  content: string;
  token_count: number | null;
  embedding: number[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ComplianceFlag {
  type: 'overdue_filing' | 'due_soon_filing' | 'missing_document';
  taskId?: string;
  documentType?: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ComplianceStatusRecord {
  id: string;
  owner_id: string;
  client_id: string;
  status: ComplianceStatusValue;
  next_due_date: string | null;
  next_due_filing_type: string | null;
  overdue_count: number;
  missing_docs_count: number;
  details: ComplianceFlag[];
  last_evaluated_at: string;
}

export interface AgentRun {
  id: string;
  owner_id: string;
  client_id: string | null;
  document_id: string | null;
  run_type: AgentRunType;
  status: AgentRunStatus;
  provider: string;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface RagQuery {
  id: string;
  owner_id: string;
  client_id: string;
  question: string;
  answer: string | null;
  source_chunk_ids: string[] | null;
  provider: string | null;
  created_at: string;
}
