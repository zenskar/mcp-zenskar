import type { InvoicePreviewPayload } from '../types'

export const invoicePreviewFixture: InvoicePreviewPayload = {
  html: `<!DOCTYPE html>
<html>
<head><style>body{font-family:system-ui;margin:40px;color:#334155}h1{font-size:24px;margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #e2e8f0}th{background:#f8fafc;font-size:12px;text-transform:uppercase;color:#64748b}td{font-size:14px}.total{font-weight:600;text-align:right}.header{display:flex;justify-content:space-between}.meta{color:#64748b;font-size:13px}</style></head>
<body>
<div class="header"><div><h1>Invoice INV-2026-0142</h1><p class="meta">ACME Corp &middot; May 1, 2026</p></div><div style="text-align:right"><p class="meta">Due: May 30, 2026</p><p style="font-size:20px;font-weight:700">$1,845.50</p></div></div>
<table><thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead><tbody><tr><td>Platform subscription</td><td>1</td><td style="text-align:right">$1,200.00</td></tr><tr><td>API requests (per-1k)</td><td>12,910</td><td style="text-align:right">$645.50</td></tr></tbody><tfoot><tr><td colspan="2" class="total">Total</td><td style="text-align:right;font-weight:700">$1,845.50</td></tr></tfoot></table>
</body></html>`,
  invoice_id: 'inv_001',
}
