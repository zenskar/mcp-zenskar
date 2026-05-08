import { App } from '@modelcontextprotocol/ext-apps';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { notifyHost } from './postMessage';

interface OpenAIGlobals {
  toolInput?: { toolName?: string } | null;
  toolOutput?: unknown;
}

function readOpenAIGlobals(): OpenAIGlobals | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { openai?: OpenAIGlobals }).openai ?? null;
}

interface ShellProps<T> {
  fallback: T;
  readyMarker?: string;
  render: (data: T) => ReactNode;
}

export function Shell<T>({ fallback, readyMarker, render }: ShellProps<T>) {
  const initial = readOpenAIGlobals();
  const [data, setData] = useState<T | null>(
    (initial?.toolOutput as T | null) ?? null
  );
  const ref = useRef<HTMLDivElement>(null);

  // MCP Apps bridge — Claude Desktop / VS Code / Goose. Vanilla App class (skips
  // /react subpath which transitively pulls SDK Protocol + zod locales).
  useEffect(() => {
    const app = new App({ name: 'Zenskar', version: '1.0.0' }, {});
    app.ontoolresult = (params: { structuredContent?: unknown } | undefined) => {
      if (params && Object.prototype.hasOwnProperty.call(params, 'structuredContent')) {
        setData((params.structuredContent as T | null) ?? null);
      }
    };
    app.connect().catch(() => {
      // Host absent (dev preview / no parent frame) — leave fallback in place.
    });
    return () => {
      app.close().catch(() => { /* ignore */ });
    };
  }, []);

  // OpenAI bridge — ChatGPT iframe.
  useEffect(() => {
    const handler = (event: any) => {
      const globals = event?.detail?.globals;
      if (!globals) return;
      if (Object.prototype.hasOwnProperty.call(globals, 'toolOutput')) {
        setData((globals.toolOutput as T | null) ?? null);
      }
    };
    window.addEventListener('openai:set_globals', handler, { passive: true } as AddEventListenerOptions);
    return () => {
      window.removeEventListener('openai:set_globals', handler);
    };
  }, []);

  // ReadyMarker + size reporting (legacy postMessage notification).
  useEffect(() => {
    if (data === null) return;
    if (readyMarker) notifyHost('ui/message', { hidden: true, marker: readyMarker });
    if (!ref.current) return;
    const post = () => {
      const r = ref.current!.getBoundingClientRect();
      notifyHost('ui/notifications/size-changed', {
        width: Math.round(r.width),
        height: Math.round(r.height),
      });
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [data, readyMarker]);

  const resolved = data ?? fallback;

  if (data === null && !initial?.toolOutput) {
    return <div data-shell-loading style={{ visibility: 'hidden', minHeight: 1 }} />;
  }

  return (
    <div ref={ref} className="font-sans text-[14px] text-fg bg-bg p-4">
      {render(resolved)}
    </div>
  );
}
