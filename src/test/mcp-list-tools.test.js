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
