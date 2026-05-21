const CODING_AGENTS = [
  'claude-code',
  'cline',
  'roo-code',
  'continue',
  'codex',
  'windsurf',
  'zed',
  'aider',
  'copilot',
  'gemini-cli',
]

const WIDGET_HOSTS = [
  'claude-desktop',
  'claude-ai',
  'chatgpt',
  'mcp-inspector',
  'toon',
  'cursor',
]

let _clientName = null
let _resolver = null

export function setClientName(name) {
  _clientName = name ? String(name).toLowerCase().trim() : null
}

export function setClientNameResolver(fn) {
  _resolver = fn
}

export function getClientName() {
  if (_clientName == null && _resolver) {
    const resolved = _resolver()
    if (resolved) setClientName(resolved)
  }
  return _clientName
}

export function classifyClient(name) {
  const n = (name ?? _clientName ?? '').toLowerCase().trim()
  if (!n) return 'default'
  if (CODING_AGENTS.some((a) => n.includes(a))) return 'coding-agent'
  if (WIDGET_HOSTS.some((h) => n.includes(h))) return 'widget-host'
  return 'default'
}

export function isCodingAgentClient(name) {
  return classifyClient(name) === 'coding-agent'
}

export function isWidgetHostClient(name) {
  return classifyClient(name) === 'widget-host'
}
