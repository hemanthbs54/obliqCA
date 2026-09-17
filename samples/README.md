# Sample documents (synthetic only)

Every file here comes from the **public synthetic datasets suggested by the OBLIQ-in team**, or is derived from them. No real person's, client's, bank's or company's data is used; all names, account numbers, PANs and GSTINs are fabricated by the dataset authors.

`pnpm seed` uploads these files through the real workflow (upload → review → correction → re-upload → approval), so every demo document is a genuine file with a SHA-256 fingerprint in the audit trail.

## Where each file is used

| Firm | Client | Document in the app | File | Demo state |
|---|---|---|---|---|
| ABC & Co. | Trade Links India | Bank Statement v1 | `agamiai-indian-bank-statements/trade-links-india_statement_jan-mar-2024_pages-1-2.pdf` (**derived**) | correction requested: pages 3–6 missing |
| ABC & Co. | Trade Links India | Bank Statement v2 | `agamiai-indian-bank-statements/trade-links-india_statement_jan-mar-2024.pdf` | approved |
| ABC & Co. | Indus Novate Technologies Pvt Ltd | Purchase Register | `synthetic-finance-data/indus-novate_purchase-register_jun-2026_books.csv` | correction requested: doesn't reconcile with GSTR-2B |
| ABC & Co. | Indus Novate Technologies Pvt Ltd | Purchase Invoices | `synthetic-finance-data/indus-novate_vendor-invoice_INV-202604-012.pdf` | approved |
| ABC & Co. | Indus Novate Technologies Pvt Ltd | Salary Register | `synthetic-finance-data/indus-novate_salary-register_jun-2026.csv` | under review |
| ABC & Co. | Indus Novate Technologies Pvt Ltd | Vendor Master | `synthetic-finance-data/indus-novate_vendor-master.csv` | uploaded, awaiting review |
| XYZ & Co. | Pixelcraft Studios Pvt Ltd | Bank Statement | `ledgerbridge-pixelcraft-studios/pixelcraft_hdfc-current-account_apr-2025.csv` | approved |
| XYZ & Co. | Pixelcraft Studios Pvt Ltd | Payroll Register | `ledgerbridge-pixelcraft-studios/pixelcraft_razorpayx-payroll_apr-2025.csv` | uploaded |
| XYZ & Co. | Pixelcraft Studios Pvt Ltd | Monthly MIS Report | `ledgerbridge-pixelcraft-studios/pixelcraft_monthly-report_apr-2025.xlsx` | under review |

**For a live demo:** sign in as Rohit (staff) and upload `synthetic-finance-data/indus-novate_purchase-register_jun-2026_reconciled.csv` as the corrected Purchase Register, then sign in as Aman (reviewer) to review and approve it.

## Why the purchase-register correction is realistic

The *synthetic-finance-data* generator deliberately seeds mismatches between the company's books register and its GSTR-2B, and publishes an answer key (`indus-novate_gstr2b-recon-answer-key_jun-2026.csv`). The reviewer's correction reason in the seed quotes those real rows:

- **6 value mismatches**, e.g. `CAT/26-27/1017`: books ₹7,60,300 vs GSTR-2B ₹7,04,000
- **4 wrong vendor GSTINs**, e.g. `PIO/26-27/1003`
- **6 invoices in GSTR-2B missing from books**, e.g. `APE/26-27/1010`
- **5 booked invoices not in GSTR-2B** (ITC must be held)

## Derived files (what was changed)

| File | Derived from | Change |
|---|---|---|
| `trade-links-india_statement_jan-mar-2024_pages-1-2.pdf` | AgamiAI `India_Bank_Statement_Digital_Type1/00001.pdf` | Kept pages 1–2 of 6 to simulate an incomplete upload |
| `indus-novate_purchase-register_jun-2026_reconciled.csv` | `purchase_register_books.csv` + `gstr2b_062026.json` + `gstr2b_recon_truth.csv` | Values and GSTINs corrected to GSTR-2B, missing invoices added, a `recon_remark` column explaining each row |

Other files are unmodified apart from being renamed for readability.

## Sources and licenses

| Dataset | Source | License | Files used |
|---|---|---|---|
| AgamiAI Indian Bank Statements | https://huggingface.co/datasets/AgamiAI/Indian-Bank-Statements | Apache-2.0 | `train/India_Bank_Statement_Digital_Type1/00001.pdf` |
| synthetic-finance-data (Anuj Sureshkumar) | https://github.com/AnujSureshkumar/synthetic-finance-data | MIT (`synthetic-finance-data/LICENSE`) | `output/purchase_register_books.csv`, `gstr2b_recon_truth.csv`, `invoices_pdf/INV-202604-012.pdf`, `salary_register_202606.csv`, `vendor_master.csv`; `gstr2b_062026.json` used only to derive the reconciled register |
| LedgerBridge (PearlThoughts) | https://github.com/PearlThoughts/LedgerBridge | MIT (`ledgerbridge-pixelcraft-studios/LICENSE`) | `examples/pixelcraft-studios/statements/hdfc-ca-apr-2025.csv`, `razorpayx-payroll-apr-2025.csv`, `reports/pixelcraft-apr-2025-report.xlsx` |
| Invoice Sandbox Benchmark (ciru-ai) | https://github.com/ciru-ai/invoice-sandbox-benchmark | *No license published* | **Not bundled.** Without a license the files can't be redistributed. Its edge cases (e.g. a duplicate invoice scan) are good manual tests: download one and upload it yourself. |

The Apache-2.0 license text is at https://www.apache.org/licenses/LICENSE-2.0. The bank statement PDFs are © their dataset authors and are redistributed here unchanged except for the page-subset file noted above.
