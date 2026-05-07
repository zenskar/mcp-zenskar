type Pending = { resolve: (v: unknown) => void; reject: (e: unknown) => void };
const pending = new Map<string | number, Pending>();
let nextId = 1;

type Notification = { jsonrpc: '2.0'; method: string; params?: unknown };
type Listener = (n: Notification) => void;
const listeners = new Set<Listener>();

if (typeof window !== 'undefined') {
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || typeof msg !== 'object') return;
    if ((msg as { jsonrpc?: string }).jsonrpc !== '2.0') return;

    const m = msg as { id?: string | number; result?: unknown; error?: unknown; method?: string; params?: unknown };
    if (m.id != null && pending.has(m.id)) {
      const p = pending.get(m.id)!;
      pending.delete(m.id);
      if (m.error) p.reject(m.error);
      else p.resolve(m.result);
      return;
    }
    if (m.method) {
      const note: Notification = { jsonrpc: '2.0', method: m.method, params: m.params };
      listeners.forEach(l => { try { l(note); } catch { /* swallow */ } });
    }
  });
}

export function callHost<T = unknown>(method: string, params?: unknown, timeoutMs = 30_000): Promise<T> {
  if (typeof window === 'undefined' || !window.parent) return Promise.reject(new Error('no host'));
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error(`callHost timeout: ${method}`)); }
    }, timeoutMs);
    const wrap: Pending = {
      resolve: (v) => { clearTimeout(timer); resolve(v as T); },
      reject: (e) => { clearTimeout(timer); reject(e); },
    };
    pending.set(id, wrap);
    window.parent.postMessage({ jsonrpc: '2.0', id, method, params }, '*');
  });
}

export function notifyHost(method: string, params?: unknown): void {
  if (typeof window === 'undefined' || !window.parent) return;
  window.parent.postMessage({ jsonrpc: '2.0', method, params }, '*');
}

export function onNotification(method: string, handler: (params: unknown) => void): () => void {
  const listener: Listener = (n) => { if (n.method === method) handler(n.params); };
  listeners.add(listener);
  return () => listeners.delete(listener);
}
