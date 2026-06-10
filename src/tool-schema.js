import { z } from 'zod'

export function convertJsonSchemaToZod(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return z.any()
  }

  const unionSchemas = schema.oneOf || schema.anyOf
  if (Array.isArray(unionSchemas) && unionSchemas.length > 0) {
    const options = unionSchemas.map(convertJsonSchemaToZod)
    return options.length === 1 ? options[0] : z.union(options)
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    const values = schema.enum.filter((value) => typeof value === 'string')
    if (values.length === schema.enum.length && values.length > 0) {
      return z.enum(values)
    }
  }

  let zodType
  const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type

  if (schemaType === 'integer' || schemaType === 'number') {
    zodType = schemaType === 'integer' ? z.number().int() : z.number()
    if (typeof schema.minimum === 'number') {
      zodType = zodType.min(schema.minimum)
    }
    if (typeof schema.maximum === 'number') {
      zodType = zodType.max(schema.maximum)
    }
  } else if (schemaType === 'boolean') {
    zodType = z.boolean()
  } else if (schemaType === 'array') {
    zodType = z.array(convertJsonSchemaToZod(schema.items))
    if (typeof schema.minItems === 'number') {
      zodType = zodType.min(schema.minItems)
    }
    if (typeof schema.maxItems === 'number') {
      zodType = zodType.max(schema.maxItems)
    }
  } else if (schemaType === 'object') {
    const required = new Set(
      Array.isArray(schema.required) ? schema.required : []
    )
    const properties = schema.properties || {}
    const shape = {}

    Object.entries(properties).forEach(([key, value]) => {
      let propertySchema = convertJsonSchemaToZod(value)
      if (!required.has(key)) {
        propertySchema = propertySchema.optional()
      }
      shape[key] = propertySchema
    })

    zodType =
      schema.additionalProperties === false
        ? z.object(shape)
        : z.object(shape).passthrough()
  } else {
    zodType = z.string()
  }

  if (schema.description) {
    zodType = zodType.describe(schema.description)
  }

  return zodType
}

export function convertArgsToZodSchema(args) {
  const schemaObj = {}

  args.forEach((arg) => {
    let zodType

    if (arg.schema) {
      zodType = convertJsonSchemaToZod(arg.schema)
    } else if (arg.type === 'integer' || arg.type === 'number') {
      zodType = z.number()
    } else if (arg.type === 'boolean') {
      zodType = z.boolean()
    } else if (arg.type === 'object') {
      zodType = z.record(z.any())
    } else if (arg.type === 'array') {
      zodType = z.array(z.any())
    } else if (arg.type === 'datetime') {
      // Accept ISO-8601 string or numeric unix seconds. Backend Pydantic
      // datetime fields parse both. Lets the LLM copy ISO strings directly
      // from getContractBillingCycles output instead of converting to unix.
      zodType = z.union([z.string(), z.number()])
    } else {
      zodType = z.string()
    }

    if (arg.default !== undefined) {
      zodType = zodType.default(arg.default)
    }

    if (!arg.required) {
      zodType = zodType.optional()
    }

    if (arg.description) {
      zodType = zodType.describe(arg.description)
    }

    schemaObj[arg.name] = zodType
  })

  schemaObj.__userContext = z
    .object({
      userId: z.string().optional(),
      authorization: z.string().optional(),
      organization: z.string().optional(),
      apiKey: z.string().optional(),
      headers: z.object({}).optional(),
      approval: z
        .object({
          approved: z.boolean(),
          token: z.string().optional(),
          modifiedArguments: z.record(z.any()).optional(),
          originalArguments: z.record(z.any()).optional(),
          toolName: z.string().optional(),
        })
        .optional(),
    })
    .optional()
    .describe(
      'Internal user context for multi-tenant authentication and approval workflow'
    )

  return schemaObj
}
