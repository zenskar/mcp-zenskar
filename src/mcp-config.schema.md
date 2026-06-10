# MCP Config Arg Schemas

Tool arguments may use either the legacy simple form or an explicit JSON Schema
form.

Legacy simple form remains supported for primitive and loose object arguments:

```json
{
  "name": "limit",
  "type": "integer",
  "required": false
}
```

Use `schema` for nested or backend-shaped arguments:

```json
{
  "name": "pricing",
  "description": "Inline pricing configuration object.",
  "required": false,
  "position": "body",
  "schema": {
    "type": "object",
    "required": ["pricing_data"],
    "properties": {
      "pricing_data": {
        "type": "object",
        "required": ["pricing_type", "currency"],
        "properties": {
          "pricing_type": { "type": "string" },
          "currency": { "type": "string" }
        },
        "additionalProperties": true
      }
    },
    "additionalProperties": true
  }
}
```

When `schema` is present, it is the source of truth for MCP input validation.
The older `type` field is ignored by the schema converter in that case. Keep
`additionalProperties: true` on backend payload objects such as pricing so the
MCP enforces required fields without blocking pricing-type-specific fields that
the backend owns.
