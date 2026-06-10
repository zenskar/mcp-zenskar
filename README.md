# Zenskar MCP Server

MCP server for the Zenskar API. 113 tools covering customers, contracts, invoices, payments, credit notes, accounting, products, plans, entitlements, billable metrics, and more.

## What it does

- Customers: list, search, create, update, delete, addresses, contacts, payment methods
- Contracts: create, read, update, delete, amend, add phases and pricing, pause/resume, expire
- Invoices: list, get, approve, void, generate, credit notes, download
- Payments: create, edit, refund, delete, auto-charge
- Credit notes: list, create against invoice, get by ID
- Accounting: chart of accounts, journal entries and lines, balance sheet, income statement, account balances
- Products: CRUD, pricing configurations
- Plans: list, create, add products, preview estimates
- Entitlements: list, get, create, update, delete
- Billable metrics (aggregates): list, get, create, update, delete, schemas, estimates, logs
- Business entities: list, get, create, update
- Jobs: monitor async operations
- Custom attributes and tax categories
- Multi-tenant, supports Bearer token and API key auth

## Prerequisites

Before continuing, you need two things:

1. **Node.js 20.10 or newer** on your machine
2. **Zenskar credentials** — your Organization ID and an API Key

### Node.js

Check whether it's already installed. Open a terminal and run:

```bash
node --version
npm --version
```

This project requires **Node.js 20.10 or newer**. If both commands print a version that meets this, jump to [Zenskar credentials](#zenskar-credentials).

If you see `command not found` or a version older than 20.10, download and install the **LTS** build from https://nodejs.org/en/download. `npm` (and `npx`) ship with Node.js — no separate install needed. After installing, open a **new** terminal window and re-run `node --version` to confirm.

### Zenskar credentials

You need two values from your Zenskar dashboard. Grab both before moving to Installation.

**Organization ID** — open https://app.zenskar.com/settings (General tab) and copy your Organization ID.

**API Key** — open https://app.zenskar.com/settings?tab=api-keys, click **Create new API key**, give it a name, and copy the key.

> Store the API key somewhere safe — the dashboard only shows the full key once. If you lose it, you'll have to create a new one.

## Installation

### For Claude Desktop App

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "zenskar": {
      "command": "npx",
      "args": ["mcp-zenskar"],
      "env": {
        "ZENSKAR_ORGANIZATION": "your-org-id",
        "ZENSKAR_API_KEY": "your-api-key"
      }
    }
  }
}
```

> You can omit one or both environment variables from the config, but the server will error until Claude supplies them in a tool call. Keeping them in the env block prevents repeated credential prompts.

### For Other AI Applications

Install globally:

```bash
npm install -g mcp-zenskar
```

Or run directly:

```bash
npx mcp-zenskar
```

## Authentication

Every request needs:

1. **Organization ID** — set via `ZENSKAR_ORGANIZATION`
2. **API Key** — set via `ZENSKAR_API_KEY`

See [Zenskar credentials](#zenskar-credentials) above for how to get both.

At runtime the server reads these env vars (or accepts them from the MCP client via tool invocation).

### Advanced: bearer tokens

Same session token from your browser devtools is also accepted via `ZENSKAR_AUTH_TOKEN` (sent as `Authorization: Bearer ...`). Short-lived — API key is preferred for any non-throwaway use. Kept for backward compatibility, so existing configs that use `ZENSKAR_AUTH_TOKEN` continue to work unchanged.

## Usage

### In Claude Desktop

Once configured, you can ask Claude to interact with your Zenskar data:

```
"Show me my recent customers"
"Find the contract for Acme Corp and add a $500/month add-on phase"
"Create a $25 credit note against the latest invoice for customer X"
"Show me the balance sheet and income statement"
"List all products and their pricing configurations"
"Record a $1000 successful manual payment or tax withheld amount against invoice Y"
```

## Available Tools

### Customers

| Tool              | Description                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `listCustomers`   | List customers with search, filtering, and pagination                                                    |
| `getCustomerById` | Get a customer by ID                                                                                     |
| `createCustomer`  | Create a customer with address and tax info                                                              |
| `updateCustomer`  | Update customer details (partial update)                                                                 |
| `deleteCustomer`  | Permanently delete a customer by ID (only allowed when they have no active contracts or unpaid invoices) |

### Contacts

| Tool             | Description                     |
| ---------------- | ------------------------------- |
| `listContacts`   | List contacts with pagination   |
| `getContactById` | Get a contact by ID             |
| `createContact`  | Create a contact for a customer |
| `updateContact`  | Update a contact's details      |
| `deleteContact`  | Delete a contact by ID          |

### Contracts

| Tool                         | Description                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `listContracts`              | List contracts with filtering by status, customer, dates                                                                                         |
| `getContractById`            | Get a contract with phases, pricings, and customer details                                                                                       |
| `createContract`             | Create a contract with phases and pricing                                                                                                        |
| `updateContract`             | Update contract terms, status, pricing, or renewal policy                                                                                        |
| `deleteContract`             | Delete a draft contract                                                                                                                          |
| `getContractAmendments`      | Get amendment history for a contract                                                                                                             |
| `createContractPhase`        | Add a phase to a contract (add-ons, expansions)                                                                                                  |
| `createContractPhasePricing` | Add pricing to a contract phase                                                                                                                  |
| `expireContract`             | Expire an active contract                                                                                                                        |
| `pauseContract`              | Pause an active contract from a given start date, with an unpause-extension policy (`extend` or `overlap`) and optional end date for auto-resume |
| `editPauseContract`          | Edit an existing pause phase — set or change the resume date, shift the start, or change the unpause policy                                      |
| `resumeContract`             | Resume a paused contract                                                                                                                         |
| `createContractPrompt`       | Create a contract prompt                                                                                                                         |
| `extractContractFromRaw`     | Extract contract data from raw text using AI                                                                                                     |

### Invoices

| Tool                               | Description                                                                |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `listInvoices`                     | List invoices with filtering by customer, status, dates                    |
| `getInvoiceById`                   | Get an invoice by ID                                                       |
| `getInvoiceByExternalId`           | Get an invoice by external ID                                              |
| `getInvoiceGenerationStatus`       | Check invoice generation status                                            |
| `downloadInvoice`                  | Download invoice in JSON format                                            |
| `getInvoiceContractJsonActuals`    | Get contract actuals for an invoice                                        |
| `getInvoicePayments`               | Get successful payments currently mapped to an invoice                     |
| `getInvoicePaymentsById`           | Get successful payments for a specific invoice ID                          |
| `getInvoicePaymentsWithoutRefunds` | Get original payment records for an invoice, excluding refund payment rows |
| `getInvoiceLineItems`              | Get invoice line items and pricing details                                 |
| `getInvoiceSummary`                | Get invoice summary                                                        |
| `getAllInvoiceTags`                | Get all available invoice tags                                             |
| `generateInvoicePaymentLink`       | Generate a payment link for an invoice                                     |
| `payInvoice`                       | Initiate payment for an invoice                                            |
| `approveInvoice`                   | Approve an invoice for billing                                             |
| `voidInvoice`                      | Void an invoice                                                            |
| `deleteInvoice`                    | Delete a draft invoice                                                     |
| `generateInvoice`                  | Generate an invoice for a contract and date range                          |
| `createInvoiceCreditNote`          | Create a credit note against an invoice                                    |
| `createInvoiceCharge`              | Auto-charge an invoice via payment gateway                                 |

### Payments

| Tool                  | Description                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| `listAllPayments`     | List all payments with filtering and sorting, including refund records |
| `getPaymentById`      | Get a payment by ID                                                    |
| `createPayment`       | Record a successful manual/offline payment or tax withheld amount      |
| `updatePayment`       | Update a payment's invoice allocations (`payment_parts`)               |
| `deleteManualPayment` | Delete a manual payment                                                |
| `editManualPayment`   | Edit a manual payment's amount or method                               |
| `refundPayment`       | Refund a payment (full or partial)                                     |

### Credit Notes

| Tool                | Description                       |
| ------------------- | --------------------------------- |
| `listCreditNotes`   | List credit notes with pagination |
| `getCreditNoteById` | Get a credit note by ID           |

### Products and Pricing

| Tool                   | Description                           |
| ---------------------- | ------------------------------------- |
| `listProducts`         | List products in the catalog          |
| `getProductById`       | Get a product by ID                   |
| `createProduct`        | Create a product                      |
| `updateProduct`        | Update a product's details            |
| `getProductPricings`   | Get pricing configs for a product     |
| `createProductPricing` | Create a pricing config for a product |

### Plans (Templates)

| Tool          | Description                              |
| ------------- | ---------------------------------------- |
| `listPlans`   | List plan templates                      |
| `getPlanById` | Get a plan by ID with phases and pricing |
| `createPlan`  | Create a plan template                   |

### Accounting

| Tool                 | Description                              |
| -------------------- | ---------------------------------------- |
| `getChartOfAccounts` | Get the full chart of accounts           |
| `listAccounts`       | List GL accounts with filtering          |
| `createAccount`      | Create a GL account                      |
| `listJournalEntries` | List journal entries with filtering      |
| `createJournalEntry` | Create a manual journal entry            |
| `getJournalEntry`    | Get a journal entry by ID with all lines |
| `listJournalLines`   | List journal lines across all entries    |
| `getBalanceSheet`    | Get the balance sheet report             |
| `getIncomeStatement` | Get the income statement (P&L)           |
| `getAccountBalance`  | Get balance for a specific GL account    |
| `recogniseRevenue`   | Trigger revenue recognition up to a date |

### Custom Attributes and Tax

| Tool                    | Description                          |
| ----------------------- | ------------------------------------ |
| `listCustomAttributes`  | List custom attribute definitions    |
| `createCustomAttribute` | Create a custom attribute definition |
| `listTaxCategories`     | List tax categories                  |
| `createTaxCategory`     | Create a tax category                |

### Jobs

| Tool         | Description                                  |
| ------------ | -------------------------------------------- |
| `listJobs`   | List async jobs (invoice gen, rev rec, etc.) |
| `getJobById` | Get a job by ID to check status              |

### Business Entities

| Tool                    | Description                 |
| ----------------------- | --------------------------- |
| `listBusinessEntities`  | List business entities      |
| `getBusinessEntityById` | Get a business entity by ID |
| `createBusinessEntity`  | Create a business entity    |
| `updateBusinessEntity`  | Update a business entity    |

### Customer Addresses and Payment Methods

| Tool                    | Description                             |
| ----------------------- | --------------------------------------- |
| `listCustomerAddresses` | List addresses for a customer           |
| `createCustomerAddress` | Add an address to a customer            |
| `updateCustomerAddress` | Update a customer address               |
| `listPaymentMethods`    | List payment methods for a customer     |
| `attachPaymentMethod`   | Attach a payment method to a customer   |
| `deletePaymentMethod`   | Delete a payment method from a customer |

### Metrics and Usage Events

| Tool                    | Description                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| `listAggregates`        | List Billable Metrics with filtering; backend/API may also call these aggregates                               |
| `getAggregateSchemas`   | Show the underlying schemas for Billable Metrics (Aggregates); mainly useful for debugging or integration work |
| `getAggregateEstimates` | Get Billable Metric estimates; backend/API may also call these aggregates                                      |
| `getAggregateById`      | Get a Billable Metric by ID; backend/API may also call it an aggregate                                         |
| `getAggregateLogs`      | Get logs for a Billable Metric (Aggregate)                                                                     |
| `createAggregate`       | Create a Billable Metric (Aggregate)                                                                           |
| `updateAggregate`       | Update a Billable Metric (Aggregate)                                                                           |
| `deleteAggregate`       | Delete a Billable Metric (Aggregate)                                                                           |
| `listRawMetrics`        | List Usage Events with filtering; backend/API may also call these raw metrics                                  |
| `createRawMetric`       | Create a Usage Event schema; backend/API calls this a raw metric                                               |
| `getRawMetricById`      | Get a Usage Event by ID; backend/API may also call it a raw metric                                             |
| `getRawMetricLogs`      | Get recent event rows for a Usage Event using the same preview-query path as the frontend                      |
| `getRawMetricBySlug`    | Get a Usage Event by API slug; backend/API may also call it a raw metric                                       |
| `ingestRawMetricEvent`  | Ingest a usage event                                                                                           |

### Entitlements

| Tool                 | Description                      |
| -------------------- | -------------------------------- |
| `listEntitlements`   | List entitlements with filtering |
| `getEntitlementById` | Get an entitlement by ID         |
| `createEntitlement`  | Create an entitlement            |
| `updateEntitlement`  | Update an entitlement            |
| `deleteEntitlement`  | Delete an entitlement            |

### Other

| Tool                             | Description                               |
| -------------------------------- | ----------------------------------------- |
| `getCustomerPortalConfiguration` | Get customer portal config                |
| `getCurrentDateTime`             | Get current date/time in multiple formats |

## Security

- All requests require a valid organization ID and auth token
- No credentials are stored by the server
- Auth is passed through from the client

## Development

This repo uses [pnpm](https://pnpm.io) for package management. If you don't have it, install it once with `npm install -g pnpm` (or `corepack enable && corepack prepare pnpm@latest --activate`).

```bash
# Clone the repository
git clone https://github.com/zenskar/mcp-zenskar
cd mcp-zenskar

# Install dependencies
pnpm install

# Build the bundle (produces dist/server.mjs + dist/mcp-config.json)
pnpm run build

# Run the server
pnpm start
```

### Developing Locally Without Publishing

If you want Claude Desktop to use a local checkout instead of the npm package:

```bash
# Install dependencies + build the bundle
pnpm install
pnpm run build

# Optional: install the local build globally (requires dist/ from the previous step)
npm install -g .
```

Then either point Claude to the globally-installed binary (usually `$(npm bin -g)/mcp-zenskar`) or call the built bundle directly:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/mcp-zenskar/dist/server.mjs"],
  "env": {
    "ZENSKAR_ORGANIZATION": "your-org-id",
    "ZENSKAR_AUTH_TOKEN": "your-token"
  }
}
```

To iterate on `src/server.js` without rebuilding, run it directly — `npm install` already installs the bundler's devDependencies which include the runtime libs:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/mcp-zenskar/src/server.js"]
}
```

## Configuration

The server uses `src/mcp-config.json` to define available tools and API endpoints. This file contains the complete mapping of MCP tools to Zenskar API operations. All tools are declarative — no code changes needed to add new tools.

For complex nested arguments, use the first-class `schema` field on an arg.
When present, that JSON Schema is the source of truth for MCP input validation;
see `src/mcp-config.schema.md`.

## License

MIT

## Support

For issues and support:

- GitHub Issues: https://github.com/zenskar/mcp-zenskar/issues
- Zenskar Documentation: https://docs.zenskar.com
