# Changelog

## v1.1.0 — 2026-03-06

Added 61 new tools (42 → 103 total) covering contracts, invoices, credit notes, payments, accounting, products, plans, quotes, contacts, business entities, and more.

### All Tools

| Tool | Description |
|---|---|
| `listCustomers` | List customers with search, filtering, and pagination |
| `getCustomerById` | Get a customer by ID |
| `createCustomer` | Create a customer with address and tax info |
| `updateCustomer` | Update customer details (partial update) |
| `listContacts` | List contacts with pagination |
| `getContactById` | Get a contact by ID |
| `createContact` | Create a contact for a customer |
| `updateContact` | Update a contact's details |
| `listContracts` | List contracts with filtering by status, customer, dates |
| `getContractById` | Get a contract with phases, pricings, and customer details |
| `createContract` | Create a contract with phases and pricing |
| `updateContract` | Update contract terms, status, pricing, or renewal policy |
| `deleteContract` | Delete a draft contract |
| `getContractAmendments` | Get amendment history for a contract |
| `createContractPhase` | Add a phase to a contract (add-ons, expansions) |
| `createContractPhasePricing` | Add pricing to a contract phase |
| `expireContract` | Expire an active contract |
| `createContractPrompt` | Create a contract prompt |
| `extractContractFromRaw` | Extract contract data from raw text using AI |
| `listInvoices` | List invoices with filtering by customer, status, dates |
| `getInvoiceById` | Get an invoice by ID |
| `getInvoiceByExternalId` | Get an invoice by external ID |
| `getInvoiceGenerationStatus` | Check invoice generation status |
| `downloadInvoice` | Download invoice in JSON format |
| `getInvoiceContractJsonActuals` | Get contract actuals for an invoice |
| `getInvoicePayments` | Get payments for an invoice |
| `getInvoicePaymentsById` | Get a specific payment on an invoice |
| `getInvoicePaymentsWithoutRefunds` | Get invoice payments excluding refunds |
| `getInvoiceLineItems` | Get invoice line items and pricing details |
| `getInvoiceSummary` | Get invoice summary |
| `getAllInvoiceTags` | Get all available invoice tags |
| `generateInvoicePaymentLink` | Generate a payment link for an invoice |
| `payInvoice` | Initiate payment for an invoice |
| `approveInvoice` | Approve an invoice for billing |
| `voidInvoice` | Void an approved unpaid invoice |
| `generateInvoice` | Generate an invoice for a contract and date range |
| `createInvoiceCreditNote` | Create a credit note against an invoice |
| `createInvoiceCharge` | Auto-charge an invoice via payment gateway |
| `listAllPayments` | List all payments with filtering and sorting |
| `getPaymentById` | Get a payment by ID |
| `createPayment` | Record a payment against an invoice |
| `updatePayment` | Update a payment's status or details |
| `deleteManualPayment` | Delete a manual payment |
| `editManualPayment` | Edit a manual payment's amount or method |
| `refundPayment` | Refund a payment (full or partial) |
| `listCreditNotes` | List credit notes with pagination |
| `getCreditNoteById` | Get a credit note by ID |
| `createCreditNote` | Create a standalone credit note |
| `listProducts` | List products in the catalog |
| `getProductById` | Get a product by ID |
| `createProduct` | Create a product |
| `updateProduct` | Update a product's details |
| `getProductPricings` | Get pricing configs for a product |
| `createProductPricing` | Create a pricing config for a product |
| `listPlans` | List plan templates |
| `getPlanById` | Get a plan by ID with phases and pricing |
| `createPlan` | Create a plan template |
| `addProductsToPlan` | Add products to an existing plan |
| `previewPlanEstimate` | Preview estimated billing for a plan |
| `listAggregates` | List billable metrics with filtering |
| `getAggregateSchemas` | Get all billable metric schemas |
| `getAggregateEstimates` | Get billable metric estimates |
| `getAggregateById` | Get a billable metric by ID |
| `getAggregateLogs` | Get logs for a billable metric |
| `listRawMetrics` | List usage events with filtering |
| `createRawMetric` | Create a usage event schema |
| `getRawMetricById` | Get a usage event by ID |
| `getRawMetricLogs` | Get logs for a usage event |
| `getRawMetricBySlug` | Get a usage event by API slug |
| `ingestRawMetricEvent` | Ingest a usage event |
| `getChartOfAccounts` | Get the full chart of accounts |
| `listAccounts` | List GL accounts with filtering |
| `createAccount` | Create a GL account |
| `listJournalEntries` | List journal entries with filtering |
| `createJournalEntry` | Create a manual journal entry |
| `getJournalEntry` | Get a journal entry by ID with all lines |
| `listJournalLines` | List journal lines across all entries |
| `getBalanceSheet` | Get the balance sheet report |
| `getIncomeStatement` | Get the income statement (P&L) |
| `getAccountBalance` | Get balance for a specific GL account |
| `recogniseRevenue` | Trigger revenue recognition up to a date |
| `createQuote` | Create a quote/proposal |
| `previewQuoteEstimate` | Preview estimated billing for a quote |
| `getQuoteById` | Get a quote by ID |
| `acceptQuote` | Accept a quote, converting to a contract |
| `listCustomAttributes` | List custom attribute definitions |
| `createCustomAttribute` | Create a custom attribute definition |
| `listTaxCategories` | List tax categories |
| `createTaxCategory` | Create a tax category |
| `listJobs` | List async jobs (invoice gen, rev rec, etc.) |
| `getJobById` | Get a job by ID to check status |
| `listBusinessEntities` | List business entities |
| `getBusinessEntityById` | Get a business entity by ID |
| `createBusinessEntity` | Create a business entity |
| `updateBusinessEntity` | Update a business entity |
| `listCustomerAddresses` | List addresses for a customer |
| `createCustomerAddress` | Add an address to a customer |
| `updateCustomerAddress` | Update a customer address |
| `listPaymentMethods` | List payment methods for a customer |
| `attachPaymentMethod` | Attach a payment method to a customer |
| `createEntitlement` | Create an entitlement |
| `getCustomerPortalConfiguration` | Get customer portal config |
| `getCurrentDateTime` | Get current date/time in multiple formats |

### Code Changes

- `src/mcp-config.json` — 61 new tool definitions added
- `src/server.js` — 1 line: added `updateCustomer` to address nesting logic
