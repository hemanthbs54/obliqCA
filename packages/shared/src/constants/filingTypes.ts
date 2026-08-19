import type { DocumentType, FilingCategory } from '../types/domain.js';

/** Fields the Compliance Agent's extraction step looks for, keyed by document type. */
export const EXTRACTION_FIELDS_BY_DOC_TYPE: Record<DocumentType, string[]> = {
  invoice: [
    'invoice_number',
    'invoice_date',
    'gstin',
    'taxable_amount',
    'cgst',
    'sgst',
    'igst',
    'gst_liability',
    'total_amount',
  ],
  ledger: ['period', 'opening_balance', 'closing_balance', 'total_debits', 'total_credits'],
  financial_statement: ['period', 'total_revenue', 'total_expenses', 'net_profit', 'tax_liability'],
  other: ['gstin', 'total_amount', 'document_date'],
};

/** Default checklist shown against a generated task, keyed by filing category. */
export const TASK_CHECKLIST_TEMPLATES: Record<FilingCategory, string[]> = {
  GST: ['Reconcile sales register', 'Reconcile purchase register / ITC', 'File return on GST portal', 'Save filed acknowledgement'],
  TDS: ['Compute TDS deducted for the period', 'Deposit TDS challan', 'Prepare and validate return (FVU)', 'File return on TRACES/portal'],
  ITR: ['Gather Form 16 / financial statements', 'Reconcile 26AS / AIS', 'Compute total income & tax payable', 'File return and e-verify'],
};
