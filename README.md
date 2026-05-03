# Zenskar MCP Server

MCP server for the Zenskar API. 103 tools covering customers, contracts, invoices, payments, credit notes, accounting, products, plans, and more.

## What it does

- Customers: list, search, create, update, delete, addresses, contacts, payment methods
- Contracts: create, read, update, delete, amend, add phases and pricing, pause/resume, expire
- Invoices: list, get, approve, void, generate, credit notes, download
- Payments: create, edit, refund, delete, auto-charge
- Credit notes: list, create against invoice, get by ID
- Accounting: chart of accounts, journal entries and lines, balance sheet, income statement, account balances
- Products: CRUD, pricing configurations
- Plans: list, create, add products, preview estimates
- Business entities: list, get, create, update
- Jobs: monitor async operations
- Custom attributes and tax categories
- Multi-tenant, supports Bearer token and API key auth

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
        "ZENSKAR_AUTH_TOKEN": "your-bearer-token"
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

This MCP server requires two authentication parameters for every request:

1. **Organization ID**: Your Zenskar organization identifier
2. **Authorization Token**: Your API Bearer token or API key

### Getting Your Credentials

1. **Organization ID**: Available in your Zenskar dashboard settings
2. **API Token**: Generate from Zenskar dashboard → Settings → API Keys

At runtime the server looks for these values in the tool invocation first, then falls back to the `ZENSKAR_ORGANIZATION` and `ZENSKAR_AUTH_TOKEN` environment variables. Tokens that look like JWTs are sent as `Authorization: Bearer ...`; everything else is sent as an `x-api-key` header automatically.

## Usage

### In Claude Desktop

Once configured, you can ask Claude to interact with your Zenskar data:

```
"Show me my recent customers"
"Find the contract for Acme Corp and add a $500/month add-on phase"
"Create a $25 credit note against the latest invoice for customer X"
"Show me the balance sheet and income statement"
"List all products and their pricing configurations"
"Record a $1000 manual payment against invoice Y"
```

## Available Tools

### Customers
| Tool | Description |
|---|---|
| `listCustomers` | List customers with search, filtering, and pagination |
| `getCustomerById` | Get a customer by ID |
| `createCustomer` | Create a customer with address and tax info |
| `updateCustomer` | Update customer details (partial update) |
| `deleteCustomer` | Permanently delete a customer by ID (only allowed when they have no active contracts or unpaid invoices) |

### Contacts
| Tool | Description |
|---|---|
| `listContacts` | List contacts with pagination |
| `getContactById` | Get a contact by ID |
| `createContact` | Create a contact for a customer |
| `updateContact` | Update a contact's details |
| `deleteContact` | Delete a contact by ID |

### Contracts
| Tool | Description |
|---|---|
| `listContracts` | List contracts with filtering by status, customer, dates |
| `getContractById` | Get a contract with phases, pricings, and customer details |
| `createContract` | Create a contract with phases and pricing |
| `updateContract` | Update contract terms, status, pricing, or renewal policy |
| `deleteContract` | Delete a draft contract |
| `getContractAmendments` | Get amendment history for a contract |
| `createContractPhase` | Add a phase to a contract (add-ons, expansions) |
| `createContractPhasePricing` | Add pricing to a contract phase |
| `expireContract` | Expire an active contract |
| `pauseContract` | Pause an active contract from a given start date, with an unpause-extension policy (`extend` or `overlap`) and optional end date for auto-resume |
| `editPauseContract` | Edit an existing pause phase — set or change the resume date, shift the start, or change the unpause policy |
| `resumeContract` | Resume a paused contract |
| `createContractPrompt` | Create a contract prompt |
| `extractContractFromRaw` | Extract contract data from raw text using AI |

### Invoices
| Tool | Description |
|---|---|
| `listInvoices` | List invoices with filtering by customer, status, dates |
| `getInvoiceById` | Get an invoice by ID |
| `getInvoiceByExternalId` | Get an invoice by external ID |
| `getInvoiceGenerationStatus` | Check invoice generation status |
| `downloadInvoice` | Download invoice in JSON format |
| `getInvoiceContractJsonActuals` | Get contract actuals for an invoice |
| `getInvoicePayments` | Get successful payments currently mapped to an invoice |
| `getInvoicePaymentsById` | Get successful payments for a specific invoice ID |
| `getInvoicePaymentsWithoutRefunds` | Get original payment records for an invoice, excluding refund payment rows |
| `getInvoiceLineItems` | Get invoice line items and pricing details |
| `getInvoiceSummary` | Get invoice summary |
| `getAllInvoiceTags` | Get all available invoice tags |
| `generateInvoicePaymentLink` | Generate a payment link for an invoice |
| `payInvoice` | Initiate payment for an invoice |
| `approveInvoice` | Approve an invoice for billing |
| `voidInvoice` | Void an invoice |
| `deleteInvoice` | Delete a draft invoice |
| `generateInvoice` | Generate an invoice for a contract and date range |
| `createInvoiceCreditNote` | Create a credit note against an invoice |
| `createInvoiceCharge` | Auto-charge an invoice via payment gateway |

### Payments
| Tool | Description |
|---|---|
| `listAllPayments` | List all payments with filtering and sorting, including refund records |
| `getPaymentById` | Get a payment by ID |
| `createPayment` | Record a payment against an invoice |
| `updatePayment` | Update a payment's invoice allocations (`payment_parts`) |
| `deleteManualPayment` | Delete a manual payment |
| `editManualPayment` | Edit a manual payment's amount or method |
| `refundPayment` | Refund a payment (full or partial) |

### Credit Notes
| Tool | Description |
|---|---|
| `listCreditNotes` | List credit notes with pagination |
| `getCreditNoteById` | Get a credit note by ID |

### Products and Pricing
| Tool | Description |
|---|---|
| `listProducts` | List products in the catalog |
| `getProductById` | Get a product by ID |
| `createProduct` | Create a product |
| `updateProduct` | Update a product's details |
| `getProductPricings` | Get pricing configs for a product |
| `createProductPricing` | Create a pricing config for a product |

### Plans (Templates)
| Tool | Description |
|---|---|
| `listPlans` | List plan templates |
| `getPlanById` | Get a plan by ID with phases and pricing |
| `createPlan` | Create a plan template |

### Accounting
| Tool | Description |
|---|---|
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

### Custom Attributes and Tax
| Tool | Description |
|---|---|
| `listCustomAttributes` | List custom attribute definitions |
| `createCustomAttribute` | Create a custom attribute definition |
| `listTaxCategories` | List tax categories |
| `createTaxCategory` | Create a tax category |

### Jobs
| Tool | Description |
|---|---|
| `listJobs` | List async jobs (invoice gen, rev rec, etc.) |
| `getJobById` | Get a job by ID to check status |

### Business Entities
| Tool | Description |
|---|---|
| `listBusinessEntities` | List business entities |
| `getBusinessEntityById` | Get a business entity by ID |
| `createBusinessEntity` | Create a business entity |
| `updateBusinessEntity` | Update a business entity |

### Customer Addresses and Payment Methods
| Tool | Description |
|---|---|
| `listCustomerAddresses` | List addresses for a customer |
| `createCustomerAddress` | Add an address to a customer |
| `updateCustomerAddress` | Update a customer address |
| `listPaymentMethods` | List payment methods for a customer |
| `attachPaymentMethod` | Attach a payment method to a customer |
| `deletePaymentMethod` | Delete a payment method from a customer |

### Metrics and Usage Events
| Tool | Description |
|---|---|
| `listAggregates` | List Billable Metrics with filtering; backend/API may also call these aggregates |
| `getAggregateSchemas` | Show the underlying schemas for Billable Metrics (Aggregates); mainly useful for debugging or integration work |
| `getAggregateEstimates` | Get Billable Metric estimates; backend/API may also call these aggregates |
| `getAggregateById` | Get a Billable Metric by ID; backend/API may also call it an aggregate |
| `getAggregateLogs` | Get logs for a Billable Metric (Aggregate) |
| `listRawMetrics` | List Usage Events with filtering; backend/API may also call these raw metrics |
| `createRawMetric` | Create a Usage Event schema; backend/API calls this a raw metric |
| `getRawMetricById` | Get a Usage Event by ID; backend/API may also call it a raw metric |
| `getRawMetricLogs` | Get recent event rows for a Usage Event using the same preview-query path as the frontend |
| `getRawMetricBySlug` | Get a Usage Event by API slug; backend/API may also call it a raw metric |
| `ingestRawMetricEvent` | Ingest a usage event |

### Other
| Tool | Description |
|---|---|
| `createEntitlement` | Create an entitlement |
| `getCustomerPortalConfiguration` | Get customer portal config |
| `getCurrentDateTime` | Get current date/time in multiple formats |

## Security

- All requests require a valid organization ID and auth token
- No credentials are stored by the server
- Auth is passed through from the client

## Development

```bash
# Clone the repository
git clone https://github.com/zenskar/mcp-zenskar
cd mcp-zenskar

# Install dependencies
npm install

# Run the server
npm start
```

### Developing Locally Without Publishing

If you want Claude Desktop to use a local checkout instead of the npm package:

```bash
# Install dependencies once
npm install

# Optional: install the local build globally
npm install -g .
```

Then either point Claude to the globally-installed binary (usually `$(npm bin -g)/mcp-zenskar`) or call the repo copy directly:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/mcp-zenskar/src/server.js"],
  "env": {
    "ZENSKAR_ORGANIZATION": "your-org-id",
    "ZENSKAR_AUTH_TOKEN": "your-token"
  }
}
```

## Configuration

The server uses `src/mcp-config.json` to define available tools and API endpoints. This file contains the complete mapping of MCP tools to Zenskar API operations. All tools are declarative — no code changes needed to add new tools.

## License

MIT

## Support

For issues and support:
- GitHub Issues: https://github.com/zenskar/mcp-zenskar/issues
- Zenskar Documentation: https://docs.zenskar.com
