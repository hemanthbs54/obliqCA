-- Reference catalog of Indian CA-firm filing types. Run once after migrations.
insert into filing_types (code, name, category, frequency, description) values
  ('GST_GSTR1', 'GSTR-1 (Outward Supplies)', 'GST', 'monthly',
    'Monthly/quarterly return of outward supplies (sales) for GST-registered businesses.'),
  ('GST_GSTR3B', 'GSTR-3B (Summary Return)', 'GST', 'monthly',
    'Monthly self-declared summary GST return with tax payment.'),
  ('GST_GSTR9', 'GSTR-9 (Annual Return)', 'GST', 'annually',
    'Consolidated annual GST return.'),
  ('TDS_24Q', 'Form 24Q (TDS on Salaries)', 'TDS', 'quarterly',
    'Quarterly TDS return for tax deducted on salary payments.'),
  ('TDS_26Q', 'Form 26Q (TDS on Non-Salary)', 'TDS', 'quarterly',
    'Quarterly TDS return for tax deducted on non-salary payments (e.g. professional fees, rent).'),
  ('ITR', 'Income Tax Return (ITR)', 'ITR', 'annually',
    'Annual income tax return filing for the client.')
on conflict (code) do nothing;
