#!/usr/bin/env node
// Routing eval: does an edit to tool descriptions move which tool a model picks?
//
// Not part of `pnpm test` — it calls a real model, costs money and is not
// deterministic. Run it by hand when editing tool descriptions.
//
//   ANTHROPIC_API_KEY=... node scripts/routing-eval.js
//   ANTHROPIC_API_KEY=... node scripts/routing-eval.js --baseline <old-config.json>
//
// With --baseline every case runs against both configs and differences are
// reported. Without it, only the current config runs.
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const MODEL = process.env.EVAL_MODEL ?? 'claude-sonnet-4-6'
const TRIALS = Number(process.env.EVAL_TRIALS ?? 5)
const baselineFlag = process.argv.indexOf('--baseline')
const BASELINE = baselineFlag === -1 ? null : process.argv[baselineFlag + 1]

const TOOLS = [
  'listContracts',
  'getContractById',
  'updateContract',
  'expireContract',
  'pauseContract',
  'resumeContract',
  'createContractPhase',
  'updateCustomer',
]

// Every case names the contract. An unnamed "the contract" makes the model ask
// which one, which reads as a routing failure but is not one.
const CASES = [
  [
    'expiry: incident wording',
    'Update the expiry date on the Acme contract to 2026-08-24.',
    'expireContract',
  ],
  [
    'expiry: explicit',
    'Expire the Acme contract on 2026-09-30.',
    'expireContract',
  ],
  [
    'expiry: set end date',
    'Set the Acme contract to end on 2026-09-30.',
    'expireContract',
  ],
  [
    'rename',
    "Rename the Acme contract to 'Acme Corp Annual 2026'.",
    'updateContract',
  ],
  [
    'description',
    "Add a description to the Acme contract: 'Renewed after Q1 review'.",
    'updateContract',
  ],
  [
    'renewal policy',
    'Set the Acme contract so it does not auto-renew.',
    'updateContract',
  ],
  [
    'cancel renewal',
    'Cancel the auto-renewal on the Acme contract.',
    'updateContract',
  ],
  [
    'stop renewing',
    'Stop the Acme contract from renewing next year.',
    'updateContract',
  ],
  ['tags', "Add the tag 'enterprise' to the Acme contract.", 'updateContract'],
  [
    'contract link',
    'Set the contract link on Acme to https://example.com/signed.pdf.',
    'updateContract',
  ],
  [
    'extend',
    'Extend the Acme contract so it runs until 2028-12-31.',
    'updateContract',
  ],
  [
    'pause',
    'Pause the Acme contract from 2026-10-01, extend the end date when unpaused.',
    'pauseContract',
  ],
  ['resume', 'Resume the Acme contract now.', 'resumeContract'],
  [
    'add phase',
    'Add a new phase to the Acme contract starting 2027-01-01.',
    'createContractPhase',
  ],
  [
    'auto charge',
    'Disable auto charge for the Acme customer.',
    'updateCustomer',
  ],
]

const CONTRACT = {
  id: '784555b6',
  name: 'Acme Corp Annual',
  status: 'active',
  currency: 'USD',
  start_date: '2026-02-10T00:00:00',
  end_date: null,
  customer_id: 'ed476bb4',
  phases: [
    {
      id: '5f254d04',
      name: 'Phase 1',
      start_date: '2026-02-10T00:00:00',
      end_date: '2026-12-31T00:00:00',
      phase_type: 'active',
    },
  ],
  renewal_policy: 'renew_with_existing',
  tags: [],
}

const LIST = {
  total_count: 1,
  results: [
    { id: CONTRACT.id, name: CONTRACT.name, status: 'active', end_date: null },
  ],
}

const SYSTEM =
  "You are Zenskar's AI assistant. You help users manage customers, " +
  'contracts, invoices and payments using the available tools.'

const SCHEMA_TYPES = new Set([
  'string',
  'integer',
  'boolean',
  'number',
  'array',
  'object',
])

function toolsFrom(configPath) {
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const byName = new Map(config.tools.map((tool) => [tool.name, tool]))
  return TOOLS.map((name) => {
    const tool = byName.get(name)
    if (!tool) throw new Error(`tool ${name} is missing from ${configPath}`)
    const properties = {}
    const required = []
    for (const arg of tool.args) {
      properties[arg.name] = {
        type: SCHEMA_TYPES.has(arg.type) ? arg.type : 'string',
        description: arg.description ?? '',
        ...(arg.enum ? { enum: arg.enum } : {}),
      }
      if (arg.required) required.push(arg.name)
    }
    return {
      name: tool.name,
      description: tool.description,
      input_schema: { type: 'object', properties, required },
    }
  })
}

function messages(text) {
  return [
    { role: 'user', content: text },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Finding the contract.' },
        {
          type: 'tool_use',
          id: 't0',
          name: 'listContracts',
          input: { name__ilike: 'Acme' },
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 't0',
          content: JSON.stringify(LIST),
        },
      ],
    },
    {
      role: 'assistant',
      content: [
        { type: 'text', text: 'Fetching details.' },
        {
          type: 'tool_use',
          id: 't1',
          name: 'getContractById',
          input: { contractId: CONTRACT.id },
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 't1',
          content: JSON.stringify(CONTRACT),
        },
      ],
    },
  ]
}

// Plain fetch rather than @anthropic-ai/sdk: this is a manual script, and adding
// a dependency to a published package for it is not worth the supply-chain surface.
const API_KEY = process.env.ANTHROPIC_API_KEY
if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set')
  process.exit(1)
}

async function pick(tools, text) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM,
      tools,
      messages: messages(text),
    }),
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`)
  }
  const body = await response.json()
  const call = body.content.find((block) => block.type === 'tool_use')
  // No tool call means the model answered in prose, usually asking to confirm.
  return call ? call.name : 'asked_user'
}

async function tally(tools, text) {
  const names = await Promise.all(
    Array.from({ length: TRIALS }, () => pick(tools, text))
  )
  const counts = {}
  for (const name of names) counts[name] = (counts[name] ?? 0) + 1
  return counts
}

// Cases run a few at a time: sequentially the whole suite takes over ten minutes.
async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const index = next++
        results[index] = await fn(items[index])
      }
    }
  )
  await Promise.all(workers)
  return results
}

const current = toolsFrom(resolve(ROOT, 'src', 'mcp-config.json'))
const baseline = BASELINE ? toolsFrom(resolve(BASELINE)) : null

console.log(
  `model=${MODEL} trials=${TRIALS}${baseline ? ` baseline=${BASELINE}` : ''}\n`
)

const changed = []
const unexpected = []

const rows = await mapWithLimit(CASES, 4, async ([label, text, expected]) => ({
  label,
  expected,
  now: await tally(current, text),
  before: baseline ? await tally(baseline, text) : null,
}))

for (const { label, expected, now, before } of rows) {
  const flags = []

  if (before && JSON.stringify(before) !== JSON.stringify(now)) {
    changed.push(label)
    flags.push('CHANGED')
  }
  // asked_user is a safe outcome: the model confirmed instead of acting.
  const safe = (now[expected] ?? 0) + (now.asked_user ?? 0)
  if (safe !== TRIALS) {
    unexpected.push(label)
    flags.push('UNEXPECTED TOOL')
  }

  const shown = before
    ? `${JSON.stringify(before)} -> ${JSON.stringify(now)}`
    : JSON.stringify(now)
  const suffix = flags.length > 0 ? `   <- ${flags.join(', ')}` : ''
  console.log(
    `${label.padEnd(24)} want ${expected.padEnd(20)} ${shown}${suffix}`
  )
}

console.log(
  `\nrouting changed: ${changed.length ? changed.join(', ') : 'none'}`
)
console.log(
  `picked an unexpected tool: ${unexpected.length ? unexpected.join(', ') : 'none'}`
)
process.exitCode = unexpected.length > 0 ? 1 : 0
