# MCP Tool Validation Report

**Scope:** 92 non-accounting tools in `src/mcp-config.json` validated against backend FastAPI routes + Pydantic schemas in `/Users/chirag18/zenskar/backend`.

**Skipped (already validated in current PR/branch):** revrec + accounting (15 tools): `recogniseRevenue`, `confirmRevenueRecognition`, `discardRevenueRecognition`, `listRevenuePostings`, `refreshRevenuePostings`, `getChartOfAccounts`, `listAccounts`, `createAccount`, `listJournalEntries`, `createJournalEntry`, `getJournalEntry`, `listJournalLines`, `getBalanceSheet`, `getIncomeStatement`, `getAccountBalance`.

**Methodology:** 5 parallel Explore agents, each reading mcp-config.json + grepping `/Users/chirag18/zenskar/backend/api/*.py` and `/Users/chirag18/zenskar/backend/app/<module>/schema*.py`. Agent findings then sanity-checked by main researcher against `app/server.py` router mounts and `src/server.js` synthetic-tool handlers.

**Severity legend:**
- **P0** — broken/wrong (request will 4xx, will silently misroute, or wrong field name vs Pydantic)
- **P1** — missing useful param/field that AI realistically needs
- **P2** — description weak, misleading, or missing key context for AI
- **P3** — cosmetic (typo, minor wording)

**Corrections to agent findings (verified by main researcher):**
| Agent claim | Verified reality | Adjusted severity |
|---|---|---|
| `getCurrentDateTime` has no backend route → P0 broken (Batch 3) | **Synthetic tool**, handled in `src/server.js:730` (returns `Date()` object). Not proxied. | DROP — not a finding. |
| `/rawmetric` (singular) URLs will 404 (Batch 5, 5 tools) | `app/server.py:343-348` mounts `rawmetric_router` at BOTH `/rawmetrics` (canonical) AND `/rawmetric` (hidden legacy alias via `clone_router_with_visibility`). Tools work today. | Downgrade P0 → P3 (migrate to canonical, no urgency). |
| `ingestRawMetricEvent` URL `/usage/{slug}` will 404 (Batch 5) | Confirmed broken. `usage_events_router` mounted at `/usage_events` only (line 350). No `/usage` prefix. | **CONFIRMED P0** — will 404. |
| Aggregate path param uses `{aggregateId}` but backend uses `{aggregate_id}` (Batch 5) | Routes live in `/Users/chirag18/zenskar/backend/api/aggregate.py` (not under `app/aggregate/`). Agent did not inspect this file. **Needs deeper verification before patching.** | Hold P2 pending recheck. |

---

## Per-tool findings (compiled across 5 batches)

### Batch 1 — Customers / Contacts / Business Entities / Customer Addresses / Payment Methods

| Tool | Severity | Category | Finding | Suggested Patch |
|------|----------|----------|---------|-----------------|
| `attachPaymentMethod` | P0 | params | `connector` arg type `string` but `AttachPaymentMethodRequestSchema` requires `Connector` object `{name, reference_id}` → 422 | Change `connector` type to `object` with `{name: string, reference_id: string}` |
| `createContact` | P0 | params | `customer` body type `string` but Pydantic expects UUID; ambiguity may also be path-vs-body | Verify if `customer_id` is path param. If body, document UUID format in description. |
| `createCustomer` | P1 | sufficiency | Missing `custom_data` (Dict) + `tax_info` (List[TaxId]) — backend `CreateCustomerRequestSchema` supports both | Add args `custom_data` (object, optional) + `tax_info` (object[], optional) |
| `updateCustomer` | P1 | sufficiency | Missing `custom_data`, `tax_info`, all `ship_to_*` address fields. Only billing `address_*` exposed | Add `custom_data`, `tax_info`, `ship_to_line1/2/3/city/state/zipCode/country/country_code` |
| `updateBusinessEntity` | P1 | sufficiency | Missing `phone_number` (max 20) + `logo_url` from `UpdateBusinessEntityRequestSchema` | Add `phone_number` (string, max_length 20) + `logo_url` (string) |
| `listContacts` | P2 | description | Doesn't mention `customer_id` filter is required/expected | Update: "Retrieve paginated contacts for a customer. Requires customer_id filter. Supports email/name filters." |
| `updateContact` | P2 | description | "Supports partial updates" — vague; doesn't list fields | Update: "Update contact (first_name, last_name, email, send_contract, send_invoice). Partial update." |
| `listPaymentMethods` | P2 | description | Doesn't list filters (connector, status, external_id) | Update: "List payment methods for a customer. Filters: connector, status, external_id." |

**Clean (12):** `listCustomers`, `getCustomerById`, `deleteCustomer`, `getContactById`, `deleteContact`, `createBusinessEntity`, `listBusinessEntities`, `getBusinessEntityById`, `listCustomerAddresses`, `createCustomerAddress`, `updateCustomerAddress`, `deletePaymentMethod`.

---

### Batch 2 — Invoices / Credit Notes / Payments

| Tool | Severity | Category | Finding | Suggested Patch |
|------|----------|----------|---------|-----------------|
| `createInvoiceCharge` | P1 | sufficiency | Only `invoiceId` path param exposed. `CreateInvoiceChargeRequestSchema` has `connector`, `source`, `payment_method_types`, `skip_invoice_due_date_check` | Add body args: `connector` (object), `source` (string), `payment_method_types` (string[]), `skip_invoice_due_date_check` (boolean) |
| `refundPayment` | P1 | sufficiency | All 3 args marked `required` but partial refund semantics unclear | Update `refund_amount` description: "Amount in smallest currency unit. Omit for full refund. `refund_destination` + `writeoff_invoices` control refund destination." |
| `updatePayment` | P1 | sufficiency | Only 1 body arg (`payment_parts`) — verify backend `UpdatePaymentRequestSchema` doesn't allow more | Confirm with backend if PATCH `/payments/{id}` only updates `payment_parts`. If more, expose them. |
| `listAllPayments` | P2 | description | `search` param desc just "General search query" — no format spec | Update: "Search query: 'key=value' comma-separated (e.g. 'currency=USD,status=succeeded'). See PaymentsFilter schema." |
| `getInvoiceSummary` | P2 | description | "Get invoice summary." — vague | Update: "Returns invoice_total, amount_paid, amount_due, amount_refunded, line_item_count, taxes, discounts." |
| `getAllInvoiceTags` | P3 | description | Typo: "invoices tags" | Fix to: "Retrieve all available invoice tags." |

**Clean (23):** `listInvoices`, `getInvoiceById`, `getInvoiceGenerationStatus`, `getInvoiceByExternalId`, `downloadInvoice`, `getInvoiceContractJsonActuals`, `getInvoicePayments`, `getInvoicePaymentsById`, `getInvoicePaymentsWithoutRefunds`, `generateInvoicePaymentLink`, `payInvoice`, `getInvoiceLineItems`, `voidInvoice`, `deleteInvoice`, `createInvoiceCreditNote`, `generateInvoice`, `approveInvoice`, `getCreditNoteById`, `listCreditNotes`, `getPaymentById`, `createPayment`, `deleteManualPayment`, `editManualPayment`.

---

### Batch 3 — Contracts / Entitlements / Misc

| Tool | Severity | Category | Finding | Suggested Patch |
|------|----------|----------|---------|-----------------|
| `editPauseContract` | P1 | params | Missing `pause_phase_id` (Optional[UUID]) from `EditPauseContractRequestSchema` | Add arg `pause_phase_id` (string, optional, body): "ID of pause phase to edit" |
| `createContractPhasePricing` | P1 | sufficiency | XOR constraint `pricing_id` vs `pricing` not enforced/documented | Update description: "REQUIRED: pass EITHER `pricing_id` (existing pricing ref) OR `pricing` (inline). Not both, not neither." |
| `createContractPrompt` | P1 | description | `prompt_name`/`prompt_text` purpose unclear | Update arg descs: `prompt_name` → "e.g. 'Standard Contract Extraction'", `prompt_text` → "Instructions for AI to extract contract data" |
| `extractContractFromRaw` | P2 | sufficiency | External AI service (`https://ai.zenskar.com/...`), not in main backend. Cannot validate locally. | Note as external-service-backed; coordinate with AI service team for schema validation. |
| `listContracts` | P2 | description | Mentions `status` filter but doesn't enumerate values | Add to desc: "Status values: draft, active, paused, expired, disputed" |
| `updateContract` | P2 | description | `is_last_day_of_month` undocumented use case | Add: "Set true if billing aligns to month-end (e.g. monthly contract ending on last day)" |
| `createContractPhase` | P2 | description | `start_date`/`end_date` defaults undocumented | Add: "If start_date omitted → contract.start_date; end_date omitted → contract.end_date" |
| `expireContract` | P2 | description | `expiry_date` format constraint unstated | Update: "YYYY-MM-DD only (date, not datetime). Expires at end of day. Example: '2025-12-31'" |
| `resumeContract` | P2 | description | Method is PATCH (not POST); future-pause edge unclear | Clarify: "Resume paused contract. PATCH, no body. Pause must already have started; for future pauses use editPauseContract." |
| `deleteContract` | P3 | description | Wordy | Tighten: "Permanently delete a DRAFT contract. DESTRUCTIVE." |
| `getContractById` | P3 | description | `renewal_policy` enum not listed in response notes | Add: "renewal_policy: renew_with_default_contract \| renew_with_existing \| do_not_renew" |
| `getContractAmendments` | P3 | description | Vague | Update: "Returns amendment history (change type, timestamp, modifications)." |
| `createEntitlement` | — | — | Already correct (`Feature \| Quantity \| Credits`) | No change. |
| `getCurrentDateTime` | — | — | **Synthetic tool** in `src/server.js:730`. Not a backend route. Agent flagged P0 — incorrect. | No change. |

**Clean (3):** `pauseContract`, `createContract`, `getCurrentDateTime` (synthetic).

---

### Batch 4 — Products / Plans / CustomAttributes / Tax / Jobs / CustomerPortal

| Tool | Severity | Category | Finding | Suggested Patch |
|------|----------|----------|---------|-----------------|
| `createProduct` | P1 | params | MCP arg `name` but backend `CreateProductRequestSchema` expects `product_name` | Rename arg `name` → `product_name` |
| `createProduct` | P1 | params | MCP defines `tax_codes` but no matching backend field | Remove `tax_codes` arg |
| `createPlan` | P1 | params | Backend `CreatePlanV3RequestSchema` requires `currency` (ISO 4217), MCP has no param → backend rejects | Add `currency` (string, required, body): "ISO 4217 (USD, EUR, GBP)" |
| `createPlan` | P2 | sufficiency | `schedule` param vague; backend uses `billing_config` (anchor_day, cadence) + `renewal_config` | Clarify: "Billing schedule: JSON with billing_config.{anchor_day, cadence} + renewal_config.auto_renew" |
| `listCustomAttributes` | P2 | params | Missing `limit` for pagination | Add `limit` (integer, optional, query, default 10, max 100) |
| `listProducts` | P3 | sufficiency | No `is_active` filter — AI gets inactive products mixed in | Add `is_active` (boolean, optional, query) |
| `getCustomerPortalConfiguration` | P3 | description | Generic | Update: "Retrieve portal config: branding, theme, enabled features, UI settings" |

**Clean (11):** `getProductById`, `updateProduct`, `getProductPricings`, `createProductPricing`, `listPlans`, `getPlanById`, `createCustomAttribute`, `listTaxCategories`, `createTaxCategory`, `listJobs`, `getJobById`.

---

### Batch 5 — Aggregates / RawMetrics

| Tool | Severity | Category | Finding | Suggested Patch |
|------|----------|----------|---------|-----------------|
| `ingestRawMetricEvent` | **P0** | params | URL `/usage/{rawMetricSlug}` does not exist. Backend mounts `usage_events_router` at `/usage_events` (server.py:350). No `/usage` alias. **Confirmed broken.** | Update `requestTemplate.url` `/usage/{rawMetricSlug}` → `/usage_events/{raw_metric_slug}` |
| `getRawMetricLogs` | P1 | sufficiency | MCP defines `filters`, `aggregate_operation`, `order_by` but backend route only takes `raw_metric_id` + org header → silently ignored | Remove `filters`/`aggregate_operation`/`order_by`. Update desc: "Recent event rows (no filtering supported by backend)." |
| `getAggregateEstimates` | P1 | sufficiency | `start_date`/`end_date` typed `string`, backend Pydantic `date` — AI may send wrong format | Update arg descs: "ISO 8601 date (YYYY-MM-DD)" |
| `listAggregates` | P2 | sufficiency | `sort_key`/`sort_type` only effective for legacy `apiversion != 20230501`. Default version ignores them. | Either expose `apiversion` param OR remove sort args + note legacy-only in desc. |
| `getAggregateSchemas` | P2 | description | Internal endpoint — desc doesn't note this | Update desc: "Get ClickHouse table schemas (internal endpoint)." |
| `getAggregateById` | P3 | params | URL uses `{aggregateId}` (camelCase); needs verification against `api/aggregate.py` route decorator | Verify decorator path. If snake_case, change `{aggregateId}` → `{aggregate_id}` everywhere. |
| `getAggregateLogs` | P3 | params | Same camelCase concern | Same as above. |
| `listRawMetrics` | P3 | params | URL `/rawmetric` works (legacy alias mounted). Canonical is `/rawmetrics`. | Migrate URL to canonical `/rawmetrics`. No urgency. |
| `createRawMetric` | P3 | params | Same legacy alias concern | Migrate to `/rawmetrics`. |
| `getRawMetricById` | P3 | params | Same legacy alias + camelCase param | Migrate URL + verify param naming `{rawMetricId}` → `{raw_metric_id}` if backend uses snake_case. |
| `getRawMetricBySlug` | P3 | params | Same | Migrate + verify param naming. |

**Clean (0):** all 11 tools have at least cosmetic finding.

---

## Master patch list (ranked by severity)

### P0 — must fix (will 4xx or silently misroute)

1. **`ingestRawMetricEvent`** — change `requestTemplate.url` from `/usage/{rawMetricSlug}` to `/usage_events/{raw_metric_slug}`. Verified missing route.
2. **`attachPaymentMethod`** — change `connector` arg type from `string` to `object {name, reference_id}`.
3. **`createContact`** — verify `customer` arg position (path vs body); document UUID format if body.

### P1 — missing useful params/fields for AI

4. `createCustomer` — add `custom_data`, `tax_info`.
5. `updateCustomer` — add `custom_data`, `tax_info`, `ship_to_*` address fields.
6. `updateBusinessEntity` — add `phone_number`, `logo_url`.
7. `createInvoiceCharge` — add `connector`, `source`, `payment_method_types`, `skip_invoice_due_date_check`.
8. `createProduct` — rename `name` → `product_name`; remove unsupported `tax_codes`.
9. `createPlan` — add required `currency` (ISO 4217).
10. `editPauseContract` — add `pause_phase_id`.
11. `createContractPhasePricing` — document XOR constraint `pricing_id` vs `pricing`.
12. `createContractPrompt` — flesh out `prompt_name`/`prompt_text` descs.
13. `getRawMetricLogs` — remove ignored `filters`/`aggregate_operation`/`order_by`; clarify desc.
14. `getAggregateEstimates` — note ISO 8601 date format on `start_date`/`end_date`.
15. `refundPayment` — clarify partial-refund semantics in `refund_amount` desc.
16. `updatePayment` — verify scope of body fields with backend.

### P2 — description quality

17. `listContacts`, `updateContact`, `listPaymentMethods` — fill in filter/field info.
18. `listAllPayments` — document `search` query format.
19. `getInvoiceSummary` — list response fields.
20. `listContracts` — enumerate status values.
21. `updateContract` — explain `is_last_day_of_month`.
22. `createContractPhase` — document date defaults.
23. `expireContract` — note YYYY-MM-DD format.
24. `resumeContract` — clarify pause-must-have-started precondition.
25. `createPlan` — clarify `schedule` shape.
26. `listCustomAttributes` — add `limit` param.
27. `listAggregates` — clarify sort-args legacy-version-only.
28. `getAggregateSchemas` — note internal endpoint.

### P3 — cosmetic / migration

29. `getAllInvoiceTags` — typo fix.
30. `deleteContract`, `getContractById`, `getContractAmendments` — desc tightening.
31. `getCustomerPortalConfiguration` — desc enrichment.
32. `listProducts` — add `is_active` filter.
33. RawMetric URL migration `/rawmetric*` → `/rawmetrics*` (5 tools, no urgency — legacy alias works).
34. Aggregate path param verification (`{aggregateId}` → `{aggregate_id}`?) pending route-file recheck.

---

## Caveats

- Agents searched `app/<module>/` but FastAPI routes for some modules live in `backend/api/*.py`. Agent param-shape findings are based on Pydantic schema files (which are in `app/<module>/schema.py`), so schema-correctness findings remain valid; URL-path-decorator findings may need re-verification against `backend/api/*.py`.
- Marked P3 path-param items as "verify before patching" — not yet confirmed.
- `extractContractFromRaw` is backed by external service `ai.zenskar.com` — out of scope of this validation pass.
- This pass is read-only. No edits applied.
