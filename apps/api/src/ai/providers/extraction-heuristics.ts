import type { ExtractedField } from '../provider.js';

const NUMBER_PATTERN = /(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i;
const DATE_PATTERN = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
const GSTIN_PATTERN = /\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]\b/;

const NOT_FOUND: ExtractedField = { field: '', value: null, confidence: 0 };
function notFound(field: string): ExtractedField {
  return { ...NOT_FOUND, field };
}

/** Finds the first numeric value appearing within `window` chars after any of `keywords`. */
function findNumberNearKeyword(
  text: string,
  keywords: string[],
  window = 40,
): { value: number; excerpt: string } | null {
  const lower = text.toLowerCase();
  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword.toLowerCase());
    if (idx === -1) continue;
    const slice = text.slice(idx, idx + keyword.length + window);
    const match = slice.match(NUMBER_PATTERN);
    const raw = match?.[1];
    if (raw) {
      const value = Number(raw.replace(/,/g, ''));
      if (!Number.isNaN(value)) {
        return { value, excerpt: slice.trim().slice(0, 120) };
      }
    }
  }
  return null;
}

function findDateNearKeyword(
  text: string,
  keywords: string[],
  window = 30,
): { value: string; excerpt: string } | null {
  const lower = text.toLowerCase();
  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword.toLowerCase());
    if (idx === -1) continue;
    const slice = text.slice(idx, idx + keyword.length + window);
    const match = slice.match(DATE_PATTERN);
    const value = match?.[1];
    if (value) return { value, excerpt: slice.trim().slice(0, 120) };
  }
  const bare = text.match(DATE_PATTERN);
  const value = bare?.[1];
  return value ? { value, excerpt: bare[0] } : null;
}

const NUMBER_FIELD_KEYWORDS: Record<string, string[]> = {
  taxable_amount: ['taxable value', 'taxable amount'],
  cgst: ['cgst'],
  sgst: ['sgst'],
  igst: ['igst'],
  total_amount: ['grand total', 'total amount', 'total'],
  opening_balance: ['opening balance'],
  closing_balance: ['closing balance'],
  total_debits: ['total debit'],
  total_credits: ['total credit'],
  total_revenue: ['total revenue', 'total income'],
  total_expenses: ['total expense', 'total expenditure'],
  net_profit: ['net profit'],
  tax_liability: ['tax liability', 'gst liability'],
};

const DATE_FIELD_KEYWORDS: Record<string, string[]> = {
  invoice_date: ['invoice date', 'date'],
  document_date: ['date'],
  period: ['period', 'for the month', 'for the quarter'],
};

/**
 * Regex/heuristic field extraction over real document text — no LLM call.
 * Deliberately content-aware (not canned) so the mock provider's output is
 * honest about what it can and can't find in whatever the user uploaded.
 */
export function extractFieldsHeuristically(text: string, fields: string[]): ExtractedField[] {
  return fields.map((field): ExtractedField => {
    if (field === 'gstin') {
      const match = text.match(GSTIN_PATTERN);
      return match ? { field, value: match[0], confidence: 0.92, sourceExcerpt: match[0] } : notFound(field);
    }

    if (field === 'invoice_number') {
      const match = text.match(/invoice\s*(?:no\.?|number|#)\s*[:\-]?\s*([A-Za-z0-9/\-]+)/i);
      const value = match?.[1];
      return value
        ? { field, value, confidence: 0.85, sourceExcerpt: match[0].trim() }
        : notFound(field);
    }

    if (field === 'gst_liability') {
      const cgst = findNumberNearKeyword(text, NUMBER_FIELD_KEYWORDS.cgst ?? []);
      const sgst = findNumberNearKeyword(text, NUMBER_FIELD_KEYWORDS.sgst ?? []);
      const igst = findNumberNearKeyword(text, NUMBER_FIELD_KEYWORDS.igst ?? []);
      const sum = (cgst?.value ?? 0) + (sgst?.value ?? 0) + (igst?.value ?? 0);
      if (sum > 0) {
        return { field, value: sum, confidence: 0.8, sourceExcerpt: 'CGST + SGST + IGST' };
      }
      const direct = findNumberNearKeyword(text, ['gst liability', 'gst payable']);
      return direct
        ? { field, value: direct.value, confidence: 0.75, sourceExcerpt: direct.excerpt }
        : notFound(field);
    }

    const dateKeywords = DATE_FIELD_KEYWORDS[field];
    if (dateKeywords) {
      const result = findDateNearKeyword(text, dateKeywords);
      return result
        ? { field, value: result.value, confidence: 0.78, sourceExcerpt: result.excerpt }
        : notFound(field);
    }

    const numberKeywords = NUMBER_FIELD_KEYWORDS[field];
    if (numberKeywords) {
      const result = findNumberNearKeyword(text, numberKeywords);
      return result
        ? { field, value: result.value, confidence: 0.8, sourceExcerpt: result.excerpt }
        : notFound(field);
    }

    return notFound(field);
  });
}
