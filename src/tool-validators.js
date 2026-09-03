// Checks that JSON Schema `required` cannot express, for example nested object fields.

const MAX_BULK_INGEST_EVENTS = 500
const MAX_SCHEMA_ERRORS_REPORTED = 15

// ClickHouse type -> JS typeof/Array.isArray family. Substring match, not an
// exact lookup: dataschema types beyond normalizeClickHouseType's known
// aliases (server.js) — e.g. 'decimal', createRawMetric's own default —
// pass through unnormalized.
function clickHouseTypeFamily(type) {
  const lower = String(type).toLowerCase().trim()
  if (lower.startsWith('array(')) return 'array'
  if (/bool/.test(lower)) return 'boolean'
  if (/int|float|double|decimal|number/.test(lower)) return 'number'
  return 'string'
}

// Mirrors executeAPICall's header precedence (server.js) for a read-only GET.
function resolveZenskarRequestContext(userContext) {
  const baseUrl =
    process.env.ZENSKAR_API_BASE_URL || 'https://api.zenskar.com'
  const orgId = userContext?.organization || process.env.ZENSKAR_ORGANIZATION
  const authToken =
    userContext?.authorization ||
    userContext?.headers?.['authorization'] ||
    userContext?.headers?.['Authorization'] ||
    process.env.ZENSKAR_AUTH_TOKEN
  const apiKey =
    userContext?.apiKey ||
    userContext?.headers?.['x-api-key'] ||
    process.env.ZENSKAR_API_KEY ||
    process.env.ZENSKAR_AUTH_TOKEN
  if (!orgId) throw new Error('Organization ID is required for API access.')
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Zenskar-MCP-Server/1.0.0',
    apiversion: '20230501',
    organisation: orgId,
  }
  if (authToken && authToken.startsWith('eyJ')) {
    headers['Authorization'] = authToken.startsWith('Bearer ')
      ? authToken
      : `Bearer ${authToken}`
  } else if (apiKey) {
    headers['x-api-key'] = apiKey
  } else {
    throw new Error('Authorization is required for API access.')
  }
  // Mirrors executeAPICall's custom-header passthrough, including its
  // prototype-pollution guard (userContext.headers can originate from JSON).
  if (userContext?.headers) {
    const existingLower = new Set(Object.keys(headers).map((k) => k.toLowerCase()))
    const POISON_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
    Object.keys(userContext.headers).forEach((key) => {
      if (POISON_KEYS.has(key)) return
      if (!Object.prototype.hasOwnProperty.call(userContext.headers, key)) return
      if (userContext.headers[key] && !existingLower.has(key.toLowerCase())) {
        headers[key] = userContext.headers[key]
      }
    })
  }
  return { baseUrl, headers }
}

// Fails open on anything but a confirmed 404 — an infra hiccup here shouldn't block ingestion.
async function fetchRawMetricSchema(rawMetricSlug, userContext) {
  try {
    const { baseUrl, headers } = resolveZenskarRequestContext(userContext)
    const res = await fetch(
      `${baseUrl}/rawmetric/slug/${encodeURIComponent(rawMetricSlug)}`,
      { headers }
    )
    if (res.status === 404) return { notFound: true }
    if (!res.ok) return { schema: null }
    const body = await res.json()
    const schema = body?.dataschema || body?.api_response?.dataschema
    return { schema: schema || null }
  } catch {
    return { schema: null }
  }
}

// Schema-independent shape checks — must still run when the schema fetch fails open.
function checkEventsStructure(events) {
  const errors = []
  events.forEach((event, i) => {
    if (typeof event !== 'object' || event === null) {
      errors.push(`Event ${i}: must be an object.`)
      return
    }
    if (!event.customer_id)
      errors.push(`Event ${i}: missing required field 'customer_id'.`)
    if (!event.timestamp)
      errors.push(`Event ${i}: missing required field 'timestamp'.`)
    if (
      event.data !== undefined &&
      (typeof event.data !== 'object' || event.data === null)
    ) {
      errors.push(`Event ${i}: 'data' must be an object.`)
    }
  })
  return errors
}

function checkEventsAgainstSchema(events, schema) {
  const dataFields = schema.data || {}
  const errors = []
  events.forEach((event, i) => {
    // Bad shape already reported by checkEventsStructure.
    if (typeof event !== 'object' || event === null) return
    const data = event.data
    if (data === undefined || typeof data !== 'object' || data === null) return
    Object.keys(data).forEach((key) => {
      const expectedType = dataFields[key]
      if (!expectedType) {
        errors.push(
          `Event ${i}: unknown field 'data.${key}' — not part of this raw metric's schema. ` +
            `Valid fields: ${Object.keys(dataFields).join(', ') || '(none)'}.`
        )
        return
      }
      const expectedFamily = clickHouseTypeFamily(expectedType)
      const actual = Array.isArray(data[key]) ? 'array' : typeof data[key]
      if (actual !== expectedFamily) {
        errors.push(
          `Event ${i}: 'data.${key}' expected ${expectedType} (${expectedFamily}), got ${actual}.`
        )
      }
    })
  })
  return errors
}

function capErrors(errors) {
  if (errors.length > MAX_SCHEMA_ERRORS_REPORTED) {
    const shown = errors.slice(0, MAX_SCHEMA_ERRORS_REPORTED)
    shown.push(`... and ${errors.length - MAX_SCHEMA_ERRORS_REPORTED} more schema errors.`)
    return shown
  }
  return errors
}

const TOOL_VALIDATORS = {
  generateInvoice(args) {
    const errors = []
    const toUnix = (v) => {
      if (typeof v === 'number') return Number.isInteger(v) ? v : null
      if (typeof v === 'string') {
        const t = Date.parse(v)
        return Number.isFinite(t) ? Math.floor(t / 1000) : null
      }
      return null
    }
    const from = toUnix(args.from_date)
    const to = toUnix(args.to_date)
    if (from === null)
      errors.push(
        "'from_date' must be either an integer UNIX timestamp (seconds) or an ISO-8601 datetime string. Copy from getContractBillingCycles.start_date."
      )
    if (to === null)
      errors.push(
        "'to_date' must be either an integer UNIX timestamp (seconds) or an ISO-8601 datetime string. Copy from getContractBillingCycles.end_date."
      )
    if (from !== null && to !== null && to <= from) {
      errors.push("'to_date' must be strictly greater than 'from_date'.")
    }
    if (toUnix(args.bill_for_date) === null) {
      errors.push(
        "'bill_for_date' is REQUIRED (UNIX seconds or ISO-8601 string). Without it the API returns a $0 invoice. Copy from getContractBillingCycles.bill_for_date — do NOT compute."
      )
    }
    if (
      !Number.isInteger(args.billing_cycle_start_day) ||
      args.billing_cycle_start_day < 1 ||
      args.billing_cycle_start_day > 31
    ) {
      errors.push(
        "'billing_cycle_start_day' is REQUIRED and must be an integer 1-31. Copy from getContractBillingCycles.billing_cycle_start_day."
      )
    }
    return errors
  },

  pauseContract(args) {
    const errors = []
    if (!args.start_date) errors.push("'start_date' is required (ISO 8601).")
    if (!args.unpause_extension_policy)
      errors.push(
        "'unpause_extension_policy' is required: 'extend' or 'overlap'."
      )
    return errors
  },

  // Backend derives status from contract-level end_date only; phase dates never
  // expire a contract.
  updateContract(args) {
    const errors = []
    const phases = Array.isArray(args.phases) ? args.phases : null
    // NaN marks a date that was supplied but could not be parsed. Folding that into
    // "absent" would skip every check below, letting a malformed date through.
    const readDate = (value) => {
      if (value === undefined || value === null || value === '') return null
      const parsed = Date.parse(value)
      return Number.isFinite(parsed) ? parsed : NaN
    }
    const contractEnd = readDate(args.end_date)
    const hasContractEnd = Number.isFinite(contractEnd)
    const phaseEnd = (phase) => {
      const parsed = readDate(phase && phase.end_date)
      return Number.isFinite(parsed) ? parsed : null
    }

    const malformed = []
    if (Number.isNaN(contractEnd))
      malformed.push(`contract end_date '${args.end_date}'`)
    if (phases) {
      phases.forEach((phase, index) => {
        if (Number.isNaN(readDate(phase && phase.end_date))) {
          malformed.push(`phase ${index + 1} end_date '${phase.end_date}'`)
        }
      })
    }
    if (malformed.length > 0) {
      errors.push(
        `Unparseable date(s): ${malformed.join(', ')}. Use ISO 8601, e.g. 2026-08-24T00:00:00. ` +
          'Day-first formats such as 24/08/2026 are not accepted, and a date that cannot be ' +
          'parsed is not treated as an absent one.'
      )
    }

    // Back-dating end_date expires the contract without trimming phases or product dates.
    if (hasContractEnd && contractEnd < Date.now()) {
      errors.push(
        "'end_date' is in the past, which expires the contract. Call expireContract instead — " +
          'it sets the same end_date and also prunes future phases, trims overlapping phases ' +
          'and caps product dates.'
      )
    }

    // A phase outliving its contract is rejected by the API; expireContract trims instead.
    if (hasContractEnd && phases) {
      const overruns = phases.filter((phase) => {
        const end = phaseEnd(phase)
        return end !== null && end > contractEnd
      })
      if (overruns.length > 0) {
        errors.push(
          `${overruns.length} phase(s) end after the contract-level 'end_date'. The API rejects ` +
            'this. To shorten contracts call expireContract, which trims phases automatically and ' +
            'accepts several contract ids in one call; ' +
            "otherwise set each phase end_date to at most the contract 'end_date'."
        )
      }
    }

    // Bounded phases under an open-ended contract leave it ACTIVE forever with no live phase,
    // whether or not those phase dates have passed yet.
    if (
      !hasContractEnd &&
      phases &&
      phases.length > 0 &&
      phases.every((phase) => phaseEnd(phase) !== null)
    ) {
      errors.push(
        "Every phase has an 'end_date' but no contract-level 'end_date' was supplied. " +
          'Contract status is derived from the contract-level end_date, not from phase dates, ' +
          'so this would leave the contract ACTIVE with no current phase. ' +
          'To expire the contract, call expireContract — it also trims phases and product dates, ' +
          'and accepts several contract ids in one call. ' +
          "To update without expiring, keep a phase open or set 'end_date' explicitly."
      )
    }
    return errors
  },

  expireContract(args) {
    // A bad date fails on every contract in the batch, so stop it once here.
    if (args.expiry_date === undefined || args.expiry_date === null) return []
    if (Number.isFinite(Date.parse(args.expiry_date))) return []
    return [
      `Unparseable 'expiry_date' '${args.expiry_date}'. Use ISO 8601, e.g. 2026-08-24. ` +
        'Day-first formats such as 24/08/2026 are not accepted.',
    ]
  },

  async ingestRawMetricEventsBulk(args) {
    const events = args.events
    if (!Array.isArray(events)) return []
    const errors = []
    if (events.length === 0) {
      errors.push("'events' is empty — nothing to ingest.")
    }
    if (events.length > MAX_BULK_INGEST_EVENTS) {
      errors.push(
        `'events' has ${events.length} entries. The limit is ${MAX_BULK_INGEST_EVENTS} per call. ` +
          `ingestRawMetricEventsBulk sends all events in a single request. Split the events into ` +
          `multiple calls of up to ${MAX_BULK_INGEST_EVENTS} events each.`
      )
    }
    // Size errors already make this call a no-op; skip the network round-trip.
    if (errors.length > 0 || !args.rawMetricSlug) return errors

    errors.push(...checkEventsStructure(events))

    const { notFound, schema } = await fetchRawMetricSchema(
      args.rawMetricSlug,
      args.__userContext
    )
    if (notFound) {
      errors.push(
        `Raw metric slug '${args.rawMetricSlug}' was not found — check it via listRawMetrics ` +
          'or getRawMetricBySlug before ingesting.'
      )
      return capErrors(errors)
    }
    if (schema) errors.push(...checkEventsAgainstSchema(events, schema))
    return capErrors(errors)
  },
}

// One approval covers every id, so the list must be correct before the dialog opens.
function validateBulkArgs(tool, args) {
  const { listArg, maxBatch } = tool.bulkOver
  const ids = args[listArg]
  if (!Array.isArray(ids)) return []

  const errors = []
  if (ids.length === 0) {
    errors.push(`'${listArg}' is empty — nothing to do.`)
  }
  if (maxBatch !== undefined && ids.length > maxBatch) {
    errors.push(
      `'${listArg}' has ${ids.length} entries. The limit is ${maxBatch}. ` +
        `${tool.name} runs one item at a time. A batch must be small enough to ` +
        'review in one approval. It must also complete before the client timeout. ' +
        'Send fewer ids.'
    )
  }
  const blank = ids.filter((id) => typeof id !== 'string' || id.trim() === '')
  if (blank.length > 0) {
    errors.push(`'${listArg}' has ${blank.length} empty or non-string entries.`)
  }
  // These endpoints are not idempotent. A repeated id fails on its second attempt.
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
  if (duplicates.length > 0) {
    errors.push(`'${listArg}' repeats ${duplicates.join(', ')}.`)
  }
  return errors
}

// Return shape matches validateToolLimits: {valid, errors[]}.
export async function validateToolArgs(tool, args) {
  const validator = TOOL_VALIDATORS[tool.name]
  const errors = validator ? await validator(args) : []
  if (tool.bulkOver) errors.push(...validateBulkArgs(tool, args))
  return { valid: errors.length === 0, errors }
}
