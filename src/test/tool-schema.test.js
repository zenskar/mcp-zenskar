import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { z } from 'zod'

import { convertArgsToZodSchema } from '../tool-schema.js'

function toolArg(toolName, argName) {
  const config = JSON.parse(readFileSync('src/mcp-config.json', 'utf8'))
  const tool = config.tools.find((candidate) => candidate.name === toolName)
  assert(tool, `missing tool ${toolName}`)

  const arg = tool.args.find((candidate) => candidate.name === argName)
  assert(arg, `missing arg ${toolName}.${argName}`)
  return arg
}

test('primitive args without schema keep existing simple type conversion', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      {
        name: 'limit',
        description: 'Page size',
        type: 'integer',
        required: false,
      },
    ])
  )

  assert.equal(schema.parse({ limit: 10 }).limit, 10)
  assert.throws(() => schema.parse({ limit: '10' }))
  assert.deepEqual(schema.parse({}), {})
})

test('legacy object args without schema still accept arbitrary objects', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      {
        name: 'custom_data',
        description: 'Custom metadata',
        type: 'object',
        required: true,
      },
    ])
  )

  const parsed = schema.parse({
    custom_data: { any_nested_value: { works: true } },
  })

  assert.deepEqual(parsed.custom_data, {
    any_nested_value: { works: true },
  })
})

test('arg.schema is the source of truth when present', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      {
        name: 'payload',
        type: 'string',
        required: true,
        schema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    ])
  )

  assert.deepEqual(schema.parse({ payload: { id: 'evt_123' } }), {
    payload: { id: 'evt_123' },
  })
  assert.throws(() => schema.parse({ payload: 'evt_123' }))
  assert.throws(() => schema.parse({ payload: {} }))
})

test('schema-backed object args expose nested required fields and enums', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      {
        name: 'pricing',
        required: true,
        schema: {
          type: 'object',
          required: ['payment_terms'],
          properties: {
            payment_terms: {
              type: 'array',
              items: {
                type: 'object',
                required: ['payment_term_type', 'due_days'],
                properties: {
                  payment_term_type: {
                    type: 'string',
                    enum: ['on_approval', 'on_creation'],
                  },
                  due_days: {
                    type: 'integer',
                    minimum: 1,
                  },
                },
              },
            },
          },
          additionalProperties: true,
        },
      },
    ])
  )

  const parsed = schema.parse({
    pricing: {
      payment_terms: [
        {
          payment_term_type: 'on_approval',
          due_days: 30,
        },
      ],
      backend_specific_field: { still: 'allowed' },
    },
  })

  assert.equal(parsed.pricing.payment_terms[0].payment_term_type, 'on_approval')
  assert.deepEqual(parsed.pricing.backend_specific_field, { still: 'allowed' })
  assert.throws(() =>
    schema.parse({ pricing: { payment_terms: [{ due_days: 30 }] } })
  )
  assert.throws(() =>
    schema.parse({
      pricing: {
        payment_terms: [{ payment_term_type: 'net_30', due_days: 30 }],
      },
    })
  )
  assert.throws(() =>
    schema.parse({
      pricing: {
        payment_terms: [{ payment_term_type: 'on_creation', due_days: 0 }],
      },
    })
  )
})

test('schema-backed object args support oneOf branches', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      {
        name: 'quantity',
        required: true,
        schema: {
          oneOf: [
            {
              type: 'object',
              required: ['type', 'quantity', 'unit'],
              properties: {
                type: { type: 'string', enum: ['fixed'] },
                quantity: { type: 'number' },
                unit: { type: 'string' },
              },
              additionalProperties: true,
            },
            {
              type: 'object',
              required: ['type', 'aggregate_id'],
              properties: {
                type: { type: 'string', enum: ['metered'] },
                aggregate_id: { type: 'string' },
              },
              additionalProperties: true,
            },
          ],
        },
      },
    ])
  )

  assert.equal(
    schema.parse({
      quantity: { type: 'fixed', quantity: 10, unit: 'seat' },
    }).quantity.type,
    'fixed'
  )
  assert.equal(
    schema.parse({
      quantity: { type: 'metered', aggregate_id: 'agg_123' },
    }).quantity.type,
    'metered'
  )
  assert.throws(() => schema.parse({ quantity: { type: 'fixed' } }))
  assert.throws(() => schema.parse({ quantity: { type: 'metered' } }))
})

test('schema-backed arrays enforce minItems', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      {
        name: 'items',
        required: true,
        schema: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    ])
  )

  assert.equal(schema.parse({ items: [{ name: 'one' }] }).items[0].name, 'one')
  assert.throws(() => schema.parse({ items: [] }))
})

test('schema-backed pricing payment terms accept the backend-compatible shape', () => {
  const schema = z.object(
    convertArgsToZodSchema([toolArg('createContractPhasePricing', 'pricing')])
  )

  const parsed = schema.parse({
    pricing: {
      pricing_data: { pricing_type: 'flat_fee', currency: 'USD' },
      payment_terms: [
        {
          payment_term_type: 'on_approval',
          due_days: 30,
          label: 'Net 30',
        },
      ],
    },
  })

  assert.equal(parsed.pricing.payment_terms[0].payment_term_type, 'on_approval')
  assert.equal(parsed.pricing.payment_terms[0].due_days, 30)
  assert.equal(parsed.pricing.pricing_data.currency, 'USD')
})

test('schema-backed contract phase pricing requires pricing_data', () => {
  const schema = z.object(
    convertArgsToZodSchema([toolArg('createContractPhasePricing', 'pricing')])
  )

  assert.throws(() =>
    schema.parse({
      pricing: {
        payment_terms: [
          {
            payment_term_type: 'on_approval',
            due_days: 30,
          },
        ],
      },
    })
  )
})

test('schema-backed contract phase pricing requires pricing_data.currency', () => {
  const schema = z.object(
    convertArgsToZodSchema([toolArg('createContractPhasePricing', 'pricing')])
  )

  assert.throws(() =>
    schema.parse({
      pricing: {
        pricing_data: {
          pricing_type: 'flat_fee',
          unit_amount: 500,
        },
      },
    })
  )
})

test('createContract phases reject inline pricing without pricing_data.currency', () => {
  const schema = z.object(
    convertArgsToZodSchema([toolArg('createContract', 'phases')])
  )

  assert.throws(() =>
    schema.parse({
      phases: [
        {
          name: 'Phase 1',
          pricings: [
            {
              pricing: {
                pricing_data: {
                  pricing_type: 'flat_fee',
                  unit_amount: 500,
                },
              },
              product: {
                name: 'Subscription',
              },
            },
          ],
        },
      ],
    })
  )
})

test('createContract phases accept inline pricing with pricing_data.currency', () => {
  const schema = z.object(
    convertArgsToZodSchema([toolArg('createContract', 'phases')])
  )

  const parsed = schema.parse({
    phases: [
      {
        name: 'Phase 1',
        pricings: [
          {
            pricing: {
              pricing_data: {
                pricing_type: 'flat_fee',
                unit_amount: 500,
                currency: 'USD',
              },
            },
            product: {
              name: 'Subscription',
            },
          },
        ],
      },
    ],
  })

  assert.equal(
    parsed.phases[0].pricings[0].pricing.pricing_data.currency,
    'USD'
  )
})

test('createProductPricing structured args follow backend-shaped schemas', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      toolArg('createProductPricing', 'pricing_data'),
      toolArg('createProductPricing', 'quantity'),
      toolArg('createProductPricing', 'billing_period'),
    ])
  )

  const parsed = schema.parse({
    pricing_data: {
      pricing_type: 'flat_fee',
      unit_amount: 500,
      currency: 'USD',
    },
    quantity: {
      type: 'fixed',
      quantity: 1,
      unit: 'subscription',
    },
    billing_period: {
      cadence: 'P1M',
      offset: 'prepaid',
    },
  })

  assert.equal(parsed.pricing_data.currency, 'USD')
  assert.equal(parsed.quantity.type, 'fixed')
  assert.equal(parsed.billing_period.offset, 'prepaid')
})

test('createProductPricing rejects pricing and cadence shapes the backend cannot create', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      toolArg('createProductPricing', 'pricing_data'),
      toolArg('createProductPricing', 'quantity'),
      toolArg('createProductPricing', 'billing_period'),
    ])
  )

  assert.throws(() =>
    schema.parse({
      pricing_data: {
        pricing_type: 'flat_fee',
        unit_amount: 500,
      },
      quantity: {
        type: 'fixed',
        quantity: 1,
        unit: 'subscription',
      },
      billing_period: {
        cadence: 'P1M',
        offset: 'prepaid',
      },
    })
  )

  assert.throws(() =>
    schema.parse({
      pricing_data: {
        pricing_type: 'flat_fee',
        unit_amount: 500,
        currency: 'USD',
      },
      quantity: {
        type: 'metered',
      },
      billing_period: {
        cadence: 'P1M',
        offset: 'prepaid',
      },
    })
  )

  assert.throws(() =>
    schema.parse({
      pricing_data: {
        pricing_type: 'flat_fee',
        unit_amount: 500,
        currency: 'USD',
      },
      quantity: {
        type: 'fixed',
        quantity: 1,
        unit: 'subscription',
      },
      billing_period: {
        cadence: 'P1M',
        offset: 'P0D',
      },
    })
  )
})

test('createPlan structured args reject empty or unusable phases declaratively', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      toolArg('createPlan', 'schedule'),
      toolArg('createPlan', 'phases'),
    ])
  )

  assert.throws(() =>
    schema.parse({
      schedule: {},
      phases: [
        {
          name: 'Phase 1',
          schedule: { duration: 'P1Y' },
          order: 0,
          features: {
            pricing_data: {
              pricing_type: 'features',
              currency: 'USD',
            },
          },
        },
      ],
    })
  )

  assert.throws(() =>
    schema.parse({
      schedule: { duration: 'P1Y' },
      phases: [],
    })
  )

  assert.throws(() =>
    schema.parse({
      schedule: { duration: 'P1Y' },
      phases: [
        {
          name: 'Phase 1',
          schedule: { duration: 'P1Y' },
          order: 0,
        },
      ],
    })
  )
})

test('createPlan structured args accept backend-shaped phases', () => {
  const schema = z.object(
    convertArgsToZodSchema([
      toolArg('createPlan', 'schedule'),
      toolArg('createPlan', 'phases'),
    ])
  )

  const parsed = schema.parse({
    schedule: { duration: 'P1Y', start_offset: 'P0D' },
    phases: [
      {
        name: 'Phase 1',
        schedule: { duration: 'P1Y' },
        order: 0,
        pricings: [
          {
            schedule: { duration: 'P1Y' },
            pricing: {
              pricing_data: {
                pricing_type: 'flat_fee',
                unit_amount: 500,
                currency: 'USD',
              },
            },
            product: {
              name: 'Subscription',
            },
          },
        ],
      },
    ],
  })

  assert.equal(parsed.schedule.duration, 'P1Y')
  assert.equal(
    parsed.phases[0].pricings[0].pricing.pricing_data.currency,
    'USD'
  )
})

test('schema-backed pricing payment terms require payment_term_type', () => {
  const schema = z.object(
    convertArgsToZodSchema([toolArg('createContractPhasePricing', 'pricing')])
  )

  assert.throws(() =>
    schema.parse({
      pricing: {
        payment_terms: [{ due_days: 30, label: 'Net 30' }],
      },
    })
  )
})

test('schema-backed pricing payment terms reject invalid payment_term_type', () => {
  const schema = z.object(
    convertArgsToZodSchema([toolArg('createContractPhasePricing', 'pricing')])
  )

  assert.throws(() =>
    schema.parse({
      pricing: {
        payment_terms: [
          {
            payment_term_type: 'net_30',
            due_days: 30,
          },
        ],
      },
    })
  )
})

test('schema-backed pricing payment terms require positive integer due_days', () => {
  const schema = z.object(
    convertArgsToZodSchema([toolArg('createContractPhasePricing', 'pricing')])
  )

  assert.throws(() =>
    schema.parse({
      pricing: {
        payment_terms: [
          {
            payment_term_type: 'on_creation',
            due_days: 0,
          },
        ],
      },
    })
  )
})
