// Bulk usage-event ingestion against a recording HTTP stub: N events must cost
// ONE approval and ONE POST with a bare JSON array body, and events are
// pre-validated against the raw metric's schema before any request is sent.
import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { execPath } from 'node:process'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const events = (n) =>
  Array.from({ length: n }, (_, i) => ({
    customer_id: `test_customer_${i}`,
    timestamp: '2026-07-21 06:45:52',
    data: { region: 'AP-SOUTH-1', uploaded_data: 63.22 },
  }))

const SCHEMA_FIXTURE = {
  dataschema: {
    customer_id: 'String',
    timestamp: 'DateTime64',
    data: { region: 'String', uploaded_data: 'Float64' },
  },
}

// Mirrors createRawMetric's own default dataschema, typed 'decimal' not Float64.
const DECIMAL_SCHEMA_FIXTURE = {
  dataschema: {
    customer_id: 'String',
    timestamp: 'DateTime64',
    data: { usage_amount: 'decimal', feature_id: 'string' },
  },
}

const ARRAY_SCHEMA_FIXTURE = {
  dataschema: {
    customer_id: 'String',
    timestamp: 'DateTime64',
    data: { tags: 'Array(String)' },
  },
}

const received = []

function startStub() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => {
        received.push({ method: req.method, path: req.url, body })

        if (req.method === 'GET' && req.url.startsWith('/rawmetric/slug/')) {
          const slug = req.url.replace('/rawmetric/slug/', '')
          if (slug === 'missing_metric') {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: 'not found' }))
          }
          if (slug === 'flaky_metric') {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: 'internal error' }))
          }
          if (slug === 'decimal_metric') {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify(DECIMAL_SCHEMA_FIXTURE))
          }
          if (slug === 'array_metric') {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify(ARRAY_SCHEMA_FIXTURE))
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify(SCHEMA_FIXTURE))
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ status: 'ok' }))
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
  const client = new Client({ name: 'bulk-ingest-test', version: '1.0.0' })
  await client.connect(transport)
  return client
}

const text = (r) => r.content.map((p) => p.text).join('\n')
const approvalOf = (r) => JSON.parse(r.content[0].text)
const posts = () => received.filter((r) => r.method === 'POST')

test('bulk usage-event ingestion', async (t) => {
  const { server, port } = await startStub()
  const client = await connect(port)
  try {
    await t.test(
      'three events cost one approval and ONE POST with a bare array body',
      async () => {
        received.length = 0
        const asked = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'storage_event', events: events(3) },
        })

        const approval = approvalOf(asked)
        assert.equal(approval.type, 'approval_required')
        assert.equal(approval.arguments.events.length, 3)
        assert.equal(posts().length, 0, 'no POST before approval')

        const done = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: {
            rawMetricSlug: 'storage_event',
            events: events(3),
            __userContext: {
              approval: { approved: true, token: approval.approvalToken },
            },
          },
        })

        assert.equal(posts().length, 1, 'one POST for the whole batch')
        assert.equal(posts()[0].method, 'POST')
        assert.equal(posts()[0].path, '/usage/storage_event')

        const parsedBody = JSON.parse(posts()[0].body)
        assert.ok(Array.isArray(parsedBody), 'body is a bare JSON array')
        assert.equal(parsedBody.length, 3)
        assert.equal(parsedBody[0].customer_id, 'test_customer_0')
        assert.equal(parsedBody[0].data.region, 'AP-SOUTH-1')

        assert.match(text(done), /Usage Events Ingested \(Bulk\)/)
      }
    )

    await t.test(
      'over 500 events is rejected before any request',
      async () => {
        received.length = 0
        const r = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'storage_event', events: events(501) },
        })
        assert.equal(r.isError, true)
        assert.match(text(r), /The limit is 500/)
        assert.equal(received.length, 0, 'no request at all — size check is local')
      }
    )

    await t.test('an empty events array is rejected', async () => {
      received.length = 0
      const r = await client.callTool({
        name: 'ingestRawMetricEventsBulk',
        arguments: { rawMetricSlug: 'storage_event', events: [] },
      })
      assert.equal(r.isError, true)
      assert.match(text(r), /nothing to ingest/)
      assert.equal(received.length, 0)
    })

    await t.test(
      'dialog edits are re-validated against the batch limit',
      async () => {
        received.length = 0
        const asked = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'storage_event', events: events(2) },
        })
        const r = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: {
            rawMetricSlug: 'storage_event',
            events: events(2),
            __userContext: {
              approval: {
                approved: true,
                token: approvalOf(asked).approvalToken,
                modifiedArguments: {
                  rawMetricSlug: 'storage_event',
                  events: events(600),
                },
              },
            },
          },
        })
        assert.equal(r.isError, true)
        assert.match(text(r), /The limit is 500/)
        assert.equal(posts().length, 0)
      }
    )

    await t.test(
      'a dialog edit serialized as JSON text is parsed, not comma-shredded',
      async () => {
        received.length = 0
        const asked = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'storage_event', events: events(1) },
        })
        const edited = events(2)
        const done = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: {
            rawMetricSlug: 'storage_event',
            events: events(1),
            __userContext: {
              approval: {
                approved: true,
                token: approvalOf(asked).approvalToken,
                modifiedArguments: {
                  rawMetricSlug: 'storage_event',
                  events: JSON.stringify(edited),
                },
              },
            },
          },
        })
        assert.equal(posts().length, 1)
        const parsedBody = JSON.parse(posts()[0].body)
        assert.equal(parsedBody.length, 2, 'JSON-text edit parsed back into 2 real events')
        assert.equal(parsedBody[0].customer_id, 'test_customer_0')
        assert.match(text(done), /Usage Events Ingested \(Bulk\)/)
      }
    )

    await t.test(
      'an unknown data field is rejected before any POST',
      async () => {
        received.length = 0
        const bad = events(1)
        bad[0].data.bogus_field = 'nope'
        const r = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'storage_event', events: bad },
        })
        assert.equal(r.isError, true)
        assert.match(text(r), /unknown field 'data\.bogus_field'/)
        assert.equal(posts().length, 0)
      }
    )

    await t.test(
      'a type mismatch against the schema is rejected',
      async () => {
        received.length = 0
        const bad = events(1)
        bad[0].data.uploaded_data = 'not-a-number'
        const r = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'storage_event', events: bad },
        })
        assert.equal(r.isError, true)
        assert.match(
          text(r),
          /'data\.uploaded_data' expected Float64 \(number\), got string/
        )
        assert.equal(posts().length, 0)
      }
    )

    await t.test('a missing customer_id is rejected', async () => {
      received.length = 0
      const bad = events(1)
      delete bad[0].customer_id
      const r = await client.callTool({
        name: 'ingestRawMetricEventsBulk',
        arguments: { rawMetricSlug: 'storage_event', events: bad },
      })
      assert.equal(r.isError, true)
      assert.match(text(r), /missing required field 'customer_id'/)
      assert.equal(posts().length, 0)
    })

    await t.test(
      'an unknown raw metric slug (404) is rejected',
      async () => {
        received.length = 0
        const r = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'missing_metric', events: events(1) },
        })
        assert.equal(r.isError, true)
        assert.match(text(r), /'missing_metric' was not found/)
        assert.equal(posts().length, 0)
      }
    )

    await t.test(
      'a schema-fetch failure fails open — ingestion still proceeds',
      async () => {
        received.length = 0
        const asked = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'flaky_metric', events: events(1) },
        })
        const approval = approvalOf(asked)
        assert.equal(approval.type, 'approval_required')

        const done = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: {
            rawMetricSlug: 'flaky_metric',
            events: events(1),
            __userContext: {
              approval: { approved: true, token: approval.approvalToken },
            },
          },
        })
        assert.equal(posts().length, 1, 'unverifiable schema does not block ingestion')
        assert.match(text(done), /Usage Events Ingested \(Bulk\)/)
      }
    )

    await t.test(
      'a schema-fetch failure still catches structural errors (missing customer_id)',
      async () => {
        received.length = 0
        const bad = events(1)
        delete bad[0].customer_id
        const r = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'flaky_metric', events: bad },
        })
        assert.equal(r.isError, true)
        assert.match(text(r), /missing required field 'customer_id'/)
        assert.equal(posts().length, 0, 'fail-open only skips schema-dependent checks')
      }
    )

    await t.test(
      'omitting events entirely is rejected — no default is substituted',
      async () => {
        received.length = 0
        const r = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'storage_event' },
        })
        assert.equal(r.isError, true)
        assert.equal(received.length, 0, 'no request at all — rejected before the tool ran')
      }
    )

    await t.test(
      'a numeric field typed "decimal" (createRawMetric default) is not falsely rejected',
      async () => {
        received.length = 0
        const good = [
          {
            customer_id: 'test_customer_0',
            timestamp: '2026-07-21 06:45:52',
            data: { usage_amount: 42.5, feature_id: 'exports' },
          },
        ]
        const asked = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'decimal_metric', events: good },
        })
        const approval = approvalOf(asked)
        assert.equal(
          approval.type,
          'approval_required',
          'a valid decimal-typed numeric field must not be rejected as a type mismatch'
        )
      }
    )

    await t.test(
      'a field typed "Array(String)" accepts an actual array value',
      async () => {
        received.length = 0
        const good = [
          {
            customer_id: 'test_customer_0',
            timestamp: '2026-07-21 06:45:52',
            data: { tags: ['beta', 'renewal'] },
          },
        ]
        const asked = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'array_metric', events: good },
        })
        const approval = approvalOf(asked)
        assert.equal(
          approval.type,
          'approval_required',
          'a valid Array(String) field must not be rejected as a type mismatch'
        )
      }
    )

    await t.test(
      'a field typed "Array(String)" rejects a non-array value',
      async () => {
        received.length = 0
        const bad = [
          {
            customer_id: 'test_customer_0',
            timestamp: '2026-07-21 06:45:52',
            data: { tags: 'beta' },
          },
        ]
        const r = await client.callTool({
          name: 'ingestRawMetricEventsBulk',
          arguments: { rawMetricSlug: 'array_metric', events: bad },
        })
        assert.equal(r.isError, true)
        assert.match(
          text(r),
          /'data\.tags' expected Array\(String\) \(array\), got string/
        )
      }
    )
  } finally {
    await client.close()
    server.close()
  }
})
