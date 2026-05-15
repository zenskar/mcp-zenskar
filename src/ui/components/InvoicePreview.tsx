import { useEffect, useRef, useState } from 'preact/hooks'
import type { InvoicePreviewPayload } from '../types'
import { Dim, shortId } from './format'

export function InvoicePreview({
  payload,
}: {
  payload: InvoicePreviewPayload
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(400)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!iframeRef.current || !loaded) return
    try {
      const doc = iframeRef.current.contentDocument
      if (doc?.documentElement) {
        const h = doc.documentElement.scrollHeight
        if (h > 0) setHeight(Math.min(h + 16, 2000))
      }
    } catch {
      // cross-origin iframe — can't measure
    }
  }, [loaded, payload.html])

  if (!payload.html) {
    return (
      <div className="text-muted-foreground border-border rounded-md border py-8 text-center">
        No preview generated for this invoice yet.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {payload.invoice_id ? (
        <header className="flex items-baseline gap-2">
          <h2 className="m-0 text-lg font-semibold">Invoice Preview</h2>
          <span className="text-muted-foreground font-mono text-xs">
            {shortId(payload.invoice_id, 12)}
          </span>
        </header>
      ) : null}
      <div className="border-border overflow-hidden rounded-md border">
        <iframe
          ref={iframeRef}
          title="Invoice preview"
          srcDoc={payload.html}
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: `${height}px`,
            border: 'none',
            background: '#fff',
          }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  )
}
