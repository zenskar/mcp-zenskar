// Bulk expiry through the real MCP server against a recording HTTP stub.
// The point of the batch is that N contracts cost one approval, so these assert
// both the approval count and the requests that actually reach the API.
import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { execPath } from 'node:process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const ids = (n) =>
  Array.from(
    { length: n },
    (_, i) => `${String(i + 1).padStart(8, '0')}-1111-1111-1111-111111111111`
  )

const received = []
let failFor = null

function startStub() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        received.push({ method: req.method, path: req.url })
        if (failFor && req.url.includes(failFor)) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ detail: 'contract already expired' }))
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            status: 'active',
            end_date: '2026-08-24T23:59:59.999999',
          })
        )
      })
    })
    server.listen(0, '127.0.0.1', () =>
      resolve({ server, port: server.address().port })
    )
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
  const client = new Client({ name: 'bulk-test', version: '1.0.0' })
  await client.connect(transport)
  return client
}

const text = (r) => r.content.map((p) => p.text).join('\n')
const approvalOf = (r) => JSON.parse(r.content[0].text)

test('bulk expiry', async (t) => {
  const { server, port } = await startStub()
  const client = await connect(port)
  try {
    await t.test(
      'eight contracts cost one approval and eight PATCHes',
      async () => {
        received.length = 0
        const contractIds = ids(8)
        const asked = await client.callTool({
          name: 'expireContract',
          arguments: { contractIds, expiry_date: '2026-08-24' },
        })

        const approval = approvalOf(asked)
        assert.equal(approval.type, 'approval_required')
        assert.equal(approval.arguments.contractIds.length, 8)
        assert.equal(received.length, 0, 'nothing runs before approval')

        const done = await client.callTool({
          name: 'expireContract',
          arguments: {
            contractIds,
            expiry_date: '2026-08-24',
            __userContext: {
              approval: { approved: true, token: approval.approvalToken },
            },
          },
        })

        assert.equal(received.length, 8, 'one request per contract')
        assert.ok(
          received.every(
            (r) => r.method === 'PATCH' && r.path.endsWith('/expire')
          )
        )
        const body = text(done)
        assert.match(body, /"requested": 8/)
        assert.match(body, /"succeeded": 8/)
      }
    )

    await t.test('a failure mid-batch does not stop the rest', async () => {
      received.length = 0
      failFor = ids(8)[2]
      const contractIds = ids(8)
      const asked = await client.callTool({
        name: 'expireContract',
        arguments: { contractIds, expiry_date: '2026-08-24' },
      })
      const done = await client.callTool({
        name: 'expireContract',
        arguments: {
          contractIds,
          expiry_date: '2026-08-24',
          __userContext: {
            approval: {
              approved: true,
              token: approvalOf(asked).approvalToken,
            },
          },
        },
      })
      failFor = null

      assert.equal(received.length, 8, 'every contract is still attempted')
      const body = text(done)
      assert.match(body, /"succeeded": 7/)
      assert.match(body, /"failed": 1/)
      assert.match(body, /already expired/)
    })

    await t.test('the single-contract form still works', async () => {
      received.length = 0
      const contractId = ids(1)[0]
      const asked = await client.callTool({
        name: 'expireContract',
        arguments: { contractId, expiry_date: '2026-08-24' },
      })
      const done = await client.callTool({
        name: 'expireContract',
        arguments: {
          contractId,
          expiry_date: '2026-08-24',
          __userContext: {
            approval: {
              approved: true,
              token: approvalOf(asked).approvalToken,
            },
          },
        },
      })
      assert.equal(received.length, 1)
      assert.equal(received[0].path, `/contract_v2/${contractId}/expire`)

      // Existing callers parse api_response directly, so the single form must not
      // acquire the batch envelope.
      const body = JSON.parse(text(done))
      assert.ok(body.api_response, 'legacy response shape is preserved')
      assert.equal(body.summary, undefined)
      assert.equal(body.results, undefined)
    })

    // A token is a receipt for what the user saw, so a batch approved for two
    // contracts must not become a batch of eight on the re-invoke.
    await t.test(
      'a token cannot be replayed against a larger batch',
      async () => {
        received.length = 0
        const approvedIds = ids(2)
        const asked = await client.callTool({
          name: 'expireContract',
          arguments: { contractIds: approvedIds, expiry_date: '2026-08-24' },
        })
        await client.callTool({
          name: 'expireContract',
          arguments: {
            contractIds: ids(8), // eight, but only two were approved
            expiry_date: '2026-08-24',
            __userContext: {
              approval: {
                approved: true,
                token: approvalOf(asked).approvalToken,
              },
            },
          },
        })
        assert.equal(
          received.length,
          2,
          'only the approved contracts are expired'
        )
        for (const id of approvedIds) {
          assert.ok(received.some((r) => r.path.includes(id)))
        }
      }
    )

    await t.test(
      'dialog edits are re-validated against the batch limit',
      async () => {
        received.length = 0
        const asked = await client.callTool({
          name: 'expireContract',
          arguments: { contractIds: ids(2), expiry_date: '2026-08-24' },
        })
        const r = await client.callTool({
          name: 'expireContract',
          arguments: {
            contractIds: ids(2),
            expiry_date: '2026-08-24',
            __userContext: {
              approval: {
                approved: true,
                token: approvalOf(asked).approvalToken,
                modifiedArguments: {
                  contractIds: ids(26),
                  expiry_date: '2026-08-24',
                },
              },
            },
          },
        })
        assert.equal(r.isError, true)
        assert.match(text(r), /above the 25 limit/)
        assert.equal(received.length, 0)
      }
    )

    const rejected = [
      ['neither id form', {}, /Supply 'contractIds'/],
      [
        'both id forms',
        { contractIds: ids(2), contractId: ids(1)[0] },
        /not both/,
      ],
      ['an empty list', { contractIds: [] }, /nothing to expire/],
      [
        'a batch over the limit',
        { contractIds: ids(26) },
        /above the 25 limit/,
      ],
      ['a repeated id', { contractIds: [ids(1)[0], ids(1)[0]] }, /repeats/],
      [
        'a day-first expiry_date',
        { contractIds: ids(2), expiry_date: '24/08/2026' },
        /Unparseable 'expiry_date'/,
      ],
    ]
    for (const [label, args, expected] of rejected) {
      await t.test(`${label} is rejected before any request`, async () => {
        received.length = 0
        const r = await client.callTool({
          name: 'expireContract',
          arguments: args,
        })
        assert.equal(r.isError, true)
        assert.match(text(r), expected)
        assert.equal(received.length, 0)
      })
    }
  } finally {
    await client.close()
    server.close()
  }
})
