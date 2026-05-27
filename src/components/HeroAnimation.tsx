import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

type Row = { Name: string; Platform: string; Status: string }

const rows: Row[] = [
  { Name: 'Ali', Platform: 'Instagram', Status: 'Published' },
  { Name: 'Budi', Platform: 'TikTok', Status: 'Ideation' },
  { Name: 'Citra', Platform: 'YouTube', Status: 'Done' },
  { Name: 'Dian', Platform: 'Instagram', Status: 'Published' },
]

const statusStyle: Record<string, string> = {
  Published: 'bg-green-500/10 text-green-400 border border-green-500/20',
  Ideation: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Done: 'bg-white/5 text-white/50 border border-white/10',
}

const jsonStatusColor: Record<string, string> = {
  Published: '#00e887',
  Ideation: '#4d9fff',
  Done: 'rgba(232,232,240,0.5)',
}

function buildJsonLines(data: Row[]): string[] {
  const c = {
    bracket: 'color:rgba(255,255,255,0.4)',
    key: 'color:#4d9fff',
    muted: 'color:rgba(232,232,240,0.5)',
    str: 'color:#f8c47a',
    comma: 'color:rgba(255,255,255,0.3)',
  }

  const s = (style: string, text: string) => `<span style="${style}">${text}</span>`

  const out: string[] = []
  out.push(s(c.bracket, '['))

  data.forEach((row, i) => {
    const isLast = i === data.length - 1
    out.push(`  ${s(c.bracket, '{')}`)
    out.push(`    ${s(c.key, '"Name"')}${s(c.muted, ': ')}${s(c.str, `"${row.Name}"`)}${s(c.comma, ',')}`)
    out.push(`    ${s(c.key, '"Platform"')}${s(c.muted, ': ')}${s(c.str, `"${row.Platform}"`)}${s(c.comma, ',')}`)
    out.push(`    ${s(c.key, '"Status"')}${s(c.muted, ': ')}${s(`color:${jsonStatusColor[row.Status]}`, `"${row.Status}"`)}`)
    out.push(`  ${s(c.bracket, '}')}${isLast ? '' : s(c.comma, ',')}`)
  })

  out.push(s(c.bracket, ']'))
  return out
}

export function HeroAnimation() {
  const sheetRowsRef = useRef<HTMLTableRowElement[]>([])
  const jsonOutputRef = useRef<HTMLDivElement>(null)
  const urlStatusRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const jsonOutput = jsonOutputRef.current
    const urlStatus = urlStatusRef.current

    if (!jsonOutput || !urlStatus) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      urlStatus.textContent = '● 200 OK'
      urlStatus.style.color = '#00e887'
      buildJsonLines(rows).forEach(html => {
        const span = document.createElement('span')
        span.style.cssText = 'display:block;white-space:pre;'
        span.innerHTML = html
        jsonOutput.appendChild(span)
      })
      sheetRowsRef.current.forEach(r => r.classList.add('active-row'))
      return
    }

    function runAnimation() {
      const sheetRows = sheetRowsRef.current

      urlStatus!.textContent = '● fetching...'
      urlStatus!.style.color = 'rgba(232,232,240,0.3)'
      jsonOutput!.innerHTML = ''
      sheetRows.forEach(r => r.classList.remove('active-row'))

      const lines = buildJsonLines(rows)
      const spans = lines.map(html => {
        const span = document.createElement('span')
        span.style.cssText = 'display:block;opacity:0;transform:translateX(-4px);transition:all 0.25s ease;white-space:pre;'
        span.innerHTML = html
        jsonOutput!.appendChild(span)
        return span
      })

      // 5 lines per object: {, Name, Platform, Status, }
      const rowLineMap: Record<number, number> = {}
      let li = 1
      rows.forEach((_, i) => {
        rowLineMap[i] = li
        li += 5
      })

      let lineIdx = 0

      function revealNext() {
        if (lineIdx >= spans.length) {
          urlStatus!.textContent = '● 200 OK'
          urlStatus!.style.color = '#00e887'
          sheetRows.forEach(r => r.classList.remove('active-row'))
          timerRef.current = setTimeout(runAnimation, 3500)
          return
        }

        spans[lineIdx].style.opacity = '1'
        spans[lineIdx].style.transform = 'translateX(0)'

        const matchedRow = Object.entries(rowLineMap).find(([, l]) => l === lineIdx)
        if (matchedRow) {
          const ri = parseInt(matchedRow[0])
          sheetRows.forEach(r => r.classList.remove('active-row'))
          sheetRows[ri]?.classList.add('active-row')
        }

        lineIdx++
        timerRef.current = setTimeout(revealNext, lineIdx === 1 ? 80 : 55)
      }

      timerRef.current = setTimeout(revealNext, 600)
    }

    runAnimation()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <div className="relative w-full max-w-5xl mx-auto px-4 flex flex-col items-center gap-10">

        {/* Headline + CTA */}
        <div className="text-center flex flex-col items-center gap-4">
          <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
            <span className="font-mono text-xs text-green-400">Live demo</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
            Your sheet.<br />
            <span className="text-green-400">Now an API.</span>
          </h1>
          <p className="font-mono text-sm text-white/40">
            Connect a Google Sheet → get a REST endpoint in seconds
          </p>
          <Link
            to="/login"
            className="inline-flex items-center font-mono text-sm px-5 py-2.5 rounded-lg bg-green-400 text-black font-semibold hover:bg-green-300 transition-colors"
          >
            Get started for free
          </Link>
        </div>

        {/* Demo panels */}
        <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-6 w-full">

          {/* Sheet panel */}
          <Panel title="content-planner.gsheet" badge="Sheet1">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="font-mono text-[0.58rem] text-white/25 px-3 py-1.5 text-left border-b border-r border-white/7 bg-white/[0.02] w-7" />
                  {['Name', 'Platform', 'Status'].map((h, i) => (
                    <th key={h} className={`font-mono text-[0.58rem] text-white/25 px-3 py-1.5 text-left border-b border-white/7 bg-white/[0.02] uppercase tracking-wide ${i < 2 ? 'border-r' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    ref={el => { if (el) sheetRowsRef.current[i] = el }}
                    className="transition-colors duration-300"
                  >
                    <td className="font-mono text-[0.58rem] text-white/20 px-3 py-1.5 border-b border-r border-white/7 text-center">{i + 1}</td>
                    <td className="font-mono text-xs text-white/80 px-3 py-1.5 border-b border-r border-white/7">{row.Name}</td>
                    <td className="font-mono text-xs text-white/80 px-3 py-1.5 border-b border-r border-white/7">{row.Platform}</td>
                    <td className="font-mono text-xs px-3 py-1.5 border-b border-white/7">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[0.65rem] ${statusStyle[row.Status]}`}>
                        {row.Status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Arrow - desktop */}
          <div className="hidden md:flex flex-col items-center gap-2">
            <span className="font-mono text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-md px-2.5 py-1 whitespace-nowrap">
              SheetToAPI
            </span>
            <div className="relative w-24 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent">
              <div className="arrow-ping absolute w-2 h-2 rounded-full bg-green-400 top-[-3px]" />
              <div className="absolute right-[-1px] top-[-4px] w-0 h-0 border-l-[8px] border-l-green-400 border-y-[5px] border-y-transparent" />
            </div>
            <span className="font-mono text-xs text-white/25 text-center">GET /api/sheet/</span>
          </div>

          {/* Arrow - mobile */}
          <div className="flex md:hidden flex-col items-center gap-1.5 py-1">
            <span className="font-mono text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-md px-2.5 py-1">
              SheetToAPI
            </span>
            <div className="relative h-8 w-0.5 bg-gradient-to-b from-transparent via-green-400 to-transparent">
              <div className="absolute bottom-[-1px] left-[-4px] w-0 h-0 border-t-[8px] border-t-green-400 border-x-[5px] border-x-transparent" />
            </div>
            <span className="font-mono text-xs text-white/25">GET /api/sheet/</span>
          </div>

          {/* JSON panel */}
          <Panel title="response.json" badge="200 OK">
            <div
              ref={jsonOutputRef}
              className="font-mono text-xs leading-relaxed p-3.5 min-h-[160px] text-white/50"
            />
          </Panel>

        </div>

        {/* Endpoint bar */}
        <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0">
            GET
          </span>
          <span className="font-mono text-xs flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-white/30">https://</span>
            <span className="text-white/60">sheettoapi.net/api/sheet/</span>
            <span className="text-green-400">content-planner-a1b2c3</span>
          </span>
          <span ref={urlStatusRef} className="font-mono text-xs px-2 py-0.5 rounded flex-shrink-0">
            ● fetching...
          </span>
        </div>

      </div>
  )
}

function Panel({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden w-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/7 bg-white/[0.03]">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <span className="w-2 h-2 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-xs text-white/40">{title}</span>
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/15">{badge}</span>
      </div>
      {children}
    </div>
  )
}
