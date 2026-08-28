// End-to-end through the real MCP server against a recording HTTP stub:
// verifies which requests actually reach the API, and which never leave the server.
import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { execPath } from 'node:process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const CONTRACT_ID = '00000000-0000-0000-0000-000000000001'
const received = []

function startStub() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        received.push({ method: req.method, path: req.url, body: body ? JSON.parse(body) : null })
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ id: CONTRACT_ID, status: 'active', end_date: null }))
      })
    })
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

async function connect(port) {
  const transport = new StdioClientTransport({
    command: execPath,
    args: ['src/server.js'],
    env: {
      ...process.env,
      ZENSKAR_API_BASE_URL: `http://127.0.0.1:${port}`,
      ZENSKAR_AUTH_TOKEN: 'test-api-key',
      ZENSKAR_ORGANIZATION: '00000000-0000-0000-0000-0000000000ff',
    },
  })
  const client = new Client({ name: 'e2e', version: '1.0.0' })
  await client.connect(transport)
  return client
}

const baseArgs = {
  contractId: CONTRACT_ID,
  name: 'Contract',
  status: 'active',
  currency: 'USD',
  start_date: '2024-01-01T00:00:00',
  customer_id: '00000000-0000-0000-0000-000000000002',
}
const text = (r) => r.content.map((p) => p.text).join('\n')

test('end to end: guard, approval gate, and real endpoints', async (t) => {
  const { server, port } = await startStub()
  const client = await connect(port)
  try {
    await t.test('incident payload never reaches the API', async () => {
      received.length = 0
      const r = await client.callTool({
        name: 'updateContract',
        arguments: { ...baseArgs, phases: [{ name: 'Phase 1', start_date: '2024-01-01T00:00:00', end_date: '2026-08-24T00:00:00' }] },
      })
      assert.equal(r.isError, true)
      assert.match(text(r), /expireContract/)
      assert.equal(received.length, 0, 'no HTTP request should be issued')
    })

    await t.test('future-dated phase-only expiry also never reaches the API', async () => {
      received.length = 0
      const future = new Date(Date.now() + 365 * 864e5).toISOString()
      const r = await client.callTool({
        name: 'updateContract',
        arguments: { ...baseArgs, phases: [{ name: 'Phase 1', start_date: '2024-01-01T00:00:00', end_date: future }] },
      })
      assert.equal(r.isError, true)
      assert.equal(received.length, 0)
    })

    await t.test('legitimate update still reaches PUT /contract_v2/{id}', async () => {
      received.length = 0
      await client.callTool({
        name: 'updateContract',
        arguments: { ...baseArgs, name: 'Renamed', phases: [{ name: 'Phase 1', start_date: '2024-01-01T00:00:00' }] },
      })
      assert.equal(received.length, 1)
      assert.equal(received[0].method, 'PUT')
      assert.equal(received[0].path, `/contract_v2/${CONTRACT_ID}`)
      assert.equal(received[0].body.name, 'Renamed')
    })

    await t.test('expireContract asks for approval and issues nothing yet', async () => {
      received.length = 0
      const r = await client.callTool({
        name: 'expireContract',
        arguments: { contractId: CONTRACT_ID, expiry_date: '2026-08-24' },
      })
      const payload = JSON.parse(r.content[0].text)
      assert.equal(payload.type, 'approval_required')
      assert.ok(payload.approvalToken, 'an approval token is issued')
      assert.equal(received.length, 0, 'nothing is sent before approval')
      t.diagnostic(`token ttl: ${payload.approvalTokenExpiresInSeconds}s`)

      // Approve and re-invoke, exactly as the host does.
      received.length = 0
      await client.callTool({
        name: 'expireContract',
        arguments: {
          contractId: CONTRACT_ID,
          expiry_date: '2026-08-24',
          __userContext: { approval: { approved: true, token: payload.approvalToken } },
        },
      })
      assert.equal(received.length, 1, 'approved call reaches the API')
      assert.equal(received[0].method, 'PATCH')
      assert.equal(received[0].path, `/contract_v2/${CONTRACT_ID}/expire`)
      assert.equal(received[0].body.expiry_date, '2026-08-24')
    })
  } finally {
    await client.close()
    server.close()
  }
})
