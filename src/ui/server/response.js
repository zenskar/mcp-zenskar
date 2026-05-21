import { encode } from '@toon-format/toon'

export function formatResponse(data) {
  if (typeof data === 'string') return data
  return encode(data)
}
