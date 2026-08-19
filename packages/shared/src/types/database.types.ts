import type {
  AgentRun,
  Client,
  ClientFiling,
  ComplianceStatusRecord,
  DocumentChunk,
  DocumentRecord,
  FilingType,
  Profile,
  RagQuery,
  Task,
} from './domain.js';

/**
 * Hand-authored mirror of the Supabase-generated `Database` type, shaped so
 * `createClient<Database>()` gives full autocomplete without running the
 * Supabase CLI codegen step during scaffolding. Insert/Update variants make
 * server-generated columns (id, timestamps) optional.
 */
// Intersecting with `Record<string, unknown>` gives each shape a proper index
// signature — required for structural assignability to postgrest-js's
// `GenericTable` constraint, which plain `interface` types don't have.
type Table<Row, InsertOmit extends keyof Row, UpdateOmit extends keyof Row = InsertOmit> = {
  Row: Row & Record<string, unknown>;
  Insert: Omit<Row, InsertOmit> & Partial<Pick<Row, InsertOmit>> & Record<string, unknown>;
  Update: Partial<Omit<Row, UpdateOmit>> & Record<string, unknown>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile, 'created_at' | 'updated_at'>;
      clients: Table<Client, 'id' | 'created_at' | 'updated_at'>;
      filing_types: Table<FilingType, 'id' | 'created_at'>;
      client_filings: Table<ClientFiling, 'id' | 'created_at'>;
      tasks: Table<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'notes'>;
      documents: Table<
        DocumentRecord,
        'id' | 'created_at' | 'updated_at' | 'task_id' | 'mime_type' | 'file_size_bytes' | 'extracted_summary' | 'error_message'
      >;
      document_chunks: Table<DocumentChunk, 'id' | 'created_at'>;
      compliance_status: Table<ComplianceStatusRecord, 'id' | 'last_evaluated_at'>;
      agent_runs: Table<
        AgentRun,
        'id' | 'started_at' | 'error_message' | 'completed_at' | 'client_id' | 'document_id' | 'output' | 'input'
      >;
      rag_queries: Table<RagQuery, 'id' | 'created_at'>;
    };
    Views: Record<string, never>;
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: number[];
          match_owner_id: string;
          match_client_id: string;
          match_document_id?: string | null;
          match_count?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          similarity: number;
          metadata: Record<string, unknown>;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
