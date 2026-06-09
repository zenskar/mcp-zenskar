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
