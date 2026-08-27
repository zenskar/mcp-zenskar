import assert from 'node:assert/strict'
import { execPath } from 'node:process'
import test from 'node:test'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

test('createContractPhasePricing exposes payment term requirements through MCP listTools', async () => {
  const transport = new StdioClientTransport({
    command: execPath,
    args: ['src/server.js'],
    env: {
      ...process.env,
      ZENSKAR_API_KEY: 'test',
    },
  })
  const client = new Client({ name: 'mcp-schema-test', version: '1.0.0' })

  await client.connect(transport)
  try {
    const { tools } = await client.listTools()
    const tool = tools.find(
      (candidate) => candidate.name === 'createContractPhasePricing'
    )
    assert(tool, 'createContractPhasePricing tool should be registered')

    const pricing = tool.inputSchema.properties.pricing
    const paymentTerms = pricing.properties.payment_terms
    const paymentTerm = paymentTerms.items

    assert.equal(pricing.type, 'object')
    assert.equal(paymentTerms.type, 'array')
    assert.deepEqual(paymentTerm.required, ['payment_term_type', 'due_days'])
    assert.deepEqual(paymentTerm.properties.payment_term_type.enum, [
      'on_approval',
      'on_creation',
    ])
    assert.equal(paymentTerm.properties.due_days.type, 'integer')
    assert.equal(paymentTerm.properties.due_days.minimum, 1)
  } finally {
    await client.close()
  }
})

test('updateContract blocks a phase-only expiry that would leave the contract active', async () => {
  const transport = new StdioClientTransport({
    command: execPath,
    args: ['src/server.js'],
    env: {
      ...process.env,
      ZENSKAR_API_KEY: 'test',
    },
  })
  const client = new Client({ name: 'mcp-schema-test', version: '1.0.0' })

  await client.connect(transport)
  try {
    const blocked = await client.callTool({
      name: 'updateContract',
      arguments: {
        contractId: '00000000-0000-0000-0000-000000000001',
        name: 'Contract',
        status: 'active',
        currency: 'USD',
        start_date: '2024-01-01T00:00:00',
        customer_id: '00000000-0000-0000-0000-000000000002',
        phases: [
          {
            name: 'Phase 1',
            start_date: '2024-01-01T00:00:00',
            end_date: '2024-06-30T23:59:59',
          },
        ],
      },
    })

    assert.equal(blocked.isError, true)
    const blockedText = blocked.content.map((part) => part.text).join('\n')
    assert.match(blockedText, /invalid_arguments/)
    assert.match(blockedText, /expireContract/)

    // Fails at the API call, not the guard — only the guard's verdict matters here.
    const allowed = await client.callTool({
      name: 'updateContract',
      arguments: {
        contractId: '00000000-0000-0000-0000-000000000001',
        name: 'Contract',
        status: 'active',
        currency: 'USD',
        start_date: '2024-01-01T00:00:00',
        customer_id: '00000000-0000-0000-0000-000000000002',
        phases: [
          {
            name: 'Phase 1',
            start_date: '2024-01-01T00:00:00',
            end_date: null,
          },
        ],
      },
    })

    const allowedText = allowed.content.map((part) => part.text).join('\n')
    assert.doesNotMatch(allowedText, /invalid_arguments/)
  } finally {
    await client.close()
  }
})

test('updateContract blocks a future-dated phase-only expiry', async () => {
  const transport = new StdioClientTransport({
    command: execPath,
    args: ['src/server.js'],
    env: {
      ...process.env,
      ZENSKAR_API_KEY: 'test',
    },
  })
  const client = new Client({ name: 'mcp-schema-test', version: '1.0.0' })

  await client.connect(transport)
  try {
    const futureEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    const blocked = await client.callTool({
      name: 'updateContract',
      arguments: {
        contractId: '00000000-0000-0000-0000-000000000001',
        name: 'Contract',
        status: 'active',
        currency: 'USD',
        start_date: '2024-01-01T00:00:00',
        customer_id: '00000000-0000-0000-0000-000000000002',
        phases: [
          {
            name: 'Phase 1',
            start_date: '2024-01-01T00:00:00',
            end_date: futureEnd,
          },
        ],
      },
    })

    assert.equal(blocked.isError, true)
    const blockedText = blocked.content.map((part) => part.text).join('\n')
    assert.match(blockedText, /invalid_arguments/)
    assert.match(blockedText, /expireContract/)
  } finally {
    await client.close()
  }
})

test('updateContract blocks a phase that outlives the contract end_date', async () => {
  const transport = new StdioClientTransport({
    command: execPath,
    args: ['src/server.js'],
    env: {
      ...process.env,
      ZENSKAR_API_KEY: 'test',
    },
  })
  const client = new Client({ name: 'mcp-schema-test', version: '1.0.0' })

  await client.connect(transport)
  try {
    const blocked = await client.callTool({
      name: 'updateContract',
      arguments: {
        contractId: '00000000-0000-0000-0000-000000000001',
        name: 'Contract',
        status: 'active',
        currency: 'USD',
        start_date: '2024-01-01T00:00:00',
        customer_id: '00000000-0000-0000-0000-000000000002',
        end_date: '2030-06-30T00:00:00',
        phases: [
          {
            name: 'Phase 1',
            start_date: '2024-01-01T00:00:00',
            end_date: '2030-12-31T00:00:00',
          },
        ],
      },
    })

    assert.equal(blocked.isError, true)
    const blockedText = blocked.content.map((part) => part.text).join('\n')
    assert.match(blockedText, /end after the contract-level/)
    assert.match(blockedText, /expireContract/)
  } finally {
    await client.close()
  }
})
