import { useState, useRef } from 'react'
import { bulkAddFoodLogs } from '../../lib/mutations'

// ─── CSV parser ──────────────────────────────────────────────────────────────

function parseCSVRow(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function colIdx(headers, ...names) {
  for (const name of names) {
    const i = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
    if (i !== -1) return i
  }
  return -1
}

function parseMFPCsv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  // Find the header row — must contain "Date" and at least one of "Calorie"/"Meal"
  let headerIdx = -1
  let headers = []
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase()
    if (lower.includes('date') && (lower.includes('calorie') || lower.includes('meal'))) {
      headers = parseCSVRow(lines[i])
      headerIdx = i
      break
    }
  }

  if (headerIdx === -1) {
    return { error: 'Could not detect MFP header row. Make sure you\'re pasting from an MFP CSV export (Settings → Export Data).' }
  }

  const dateIdx    = colIdx(headers, 'date')
  const nameIdx    = colIdx(headers, 'name', 'food name', 'description')
  const mealIdx    = colIdx(headers, 'meal')
  const calIdx     = colIdx(headers, 'calorie', 'kcal', 'energy')
  const proteinIdx = colIdx(headers, 'protein')
  const carbsIdx   = colIdx(headers, 'carbohydrate', 'carbs', 'carb')
  const fatIdx     = colIdx(headers, 'fat')

  if (dateIdx === -1 || calIdx === -1) {
    return { error: 'Missing required columns. Need at least "Date" and "Calories". Found headers: ' + headers.join(', ') }
  }

  const entries = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i])
    if (row.length < 3) continue

    // Date must be YYYY-MM-DD
    const date = row[dateIdx]
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue

    // Food name — prefer the name column, fall back to meal
    const rawName = (nameIdx !== -1 ? row[nameIdx] : '') || (mealIdx !== -1 ? row[mealIdx] : '')
    const foodName = rawName.replace(/^"|"$/g, '').trim()

    // Skip aggregate/total rows
    if (!foodName || /^(total|daily total|totals|daily)/i.test(foodName)) continue

    const calories = Math.round(parseFloat(row[calIdx] || '0') || 0)
    const protein  = parseFloat(row[proteinIdx] || '0') || 0
    const carbs    = parseFloat(row[carbsIdx] || '0') || 0
    const fat      = parseFloat(row[fatIdx] || '0') || 0

    entries.push({ log_date: date, food_name: foodName, calories, protein_g: protein, carbs_g: carbs, fat_g: fat })
  }

  if (!entries.length) {
    return { error: 'No food entries found after parsing. Check the file is an MFP food diary export, not an exercise or nutrition summary.' }
  }

  return { entries }
}

// ─── Group entries by date for preview ───────────────────────────────────────

function groupByDate(entries) {
  const map = {}
  for (const e of entries) {
    if (!map[e.log_date]) map[e.log_date] = []
    map[e.log_date].push(e)
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
}

function fmt(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImportModal({ onClose, onImported }) {
  const [tab, setTab]         = useState('file')   // 'file' | 'paste'
  const [raw, setRaw]         = useState('')
  const [parsed, setParsed]   = useState(null)     // { entries } | { error }
  const [importing, setImporting] = useState(false)
  const [result, setResult]   = useState(null)     // { imported, skipped }
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target.result
      setRaw(text)
      setParsed(parseMFPCsv(text))
    }
    reader.readAsText(file)
  }

  function handleParse() {
    if (!raw.trim()) return
    setParsed(parseMFPCsv(raw))
  }

  async function handleImport() {
    if (!parsed?.entries?.length) return
    setImporting(true)
    try {
      await bulkAddFoodLogs(parsed.entries)
      setResult({ imported: parsed.entries.length })
      onImported()
    } catch (e) {
      setParsed(prev => ({ ...prev, error: e.message }))
    } finally {
      setImporting(false)
    }
  }

  const grouped = parsed?.entries ? groupByDate(parsed.entries) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-dn-surface border border-white/[0.1] rounded-sm shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
          <div>
            <div className="font-display text-[20px] tracking-[0.08em] text-dn-white">Import from MyFitnessPal</div>
            <div className="font-sans text-[11px] text-dn-graphite mt-0.5">
              MFP → Settings → Export Data → select date range → download CSV
            </div>
          </div>
          <button onClick={onClose} className="font-sans text-[18px] text-dn-graphite hover:text-dn-white transition-colors leading-none">✕</button>
        </div>

        {/* Success state */}
        {result ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
            <div className="font-display text-[48px] text-dn-orange leading-none">{result.imported}</div>
            <div className="font-sans text-[14px] text-dn-white">entries imported successfully</div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-dn-orange text-black font-sans font-semibold text-[12px] rounded-sm hover:-translate-y-px transition-all duration-150"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-white/[0.08] shrink-0">
              {[['file', 'Upload CSV File'], ['paste', 'Paste CSV Text']].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setParsed(null); setRaw('') }}
                  className={`px-5 py-3 font-sans text-[11px] uppercase tracking-[0.1em] border-b-2 transition-colors ${
                    tab === id
                      ? 'border-dn-orange text-dn-orange'
                      : 'border-transparent text-dn-graphite hover:text-dn-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="px-6 py-4 shrink-0">
              {tab === 'file' ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border border-dashed border-white/[0.15] rounded-sm p-8 text-center cursor-pointer hover:border-dn-orange/40 transition-colors"
                >
                  <div className="font-sans text-[13px] text-dn-white mb-1">Click to select your MFP export CSV</div>
                  <div className="font-sans text-[11px] text-dn-graphite">or drag and drop</div>
                  <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
                  {raw && (
                    <div className="mt-3 font-sans text-[11px] text-dn-orange">
                      File loaded — {raw.split('\n').length} lines
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-sans text-[10px] uppercase tracking-[0.15em] text-dn-graphite">
                    Paste CSV content below
                  </div>
                  <textarea
                    className="w-full h-32 bg-black/30 border border-white/[0.08] rounded-sm px-3 py-2 font-sans text-[11px] text-dn-white placeholder-dn-graphite focus:outline-none focus:border-dn-orange/40 transition-colors resize-none"
                    placeholder={"Date,Meal,Calories,Carbohydrates (g),Fat (g),Protein (g),...\n2026-06-24,Breakfast,350,45,12,28,..."}
                    value={raw}
                    onChange={e => { setRaw(e.target.value); setParsed(null) }}
                  />
                  <button
                    onClick={handleParse}
                    disabled={!raw.trim()}
                    className="px-4 py-1.5 border border-dn-orange/40 text-dn-orange font-sans text-[11px] rounded-sm hover:bg-dn-orange/10 transition-colors disabled:opacity-40"
                  >
                    Parse
                  </button>
                </div>
              )}
            </div>

            {/* Error */}
            {parsed?.error && (
              <div className="mx-6 mb-3 px-4 py-3 bg-red-400/10 border border-red-400/20 rounded-sm">
                <div className="font-sans text-[12px] text-red-400">{parsed.error}</div>
              </div>
            )}

            {/* Preview */}
            {parsed?.entries?.length > 0 && (
              <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
                <div className="font-sans text-[10px] uppercase tracking-[0.15em] text-dn-graphite mb-3">
                  Preview — {parsed.entries.length} entries across {grouped.length} day{grouped.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-3">
                  {grouped.map(([date, items]) => {
                    const dayTotal = items.reduce((s, i) => s + i.calories, 0)
                    const dayProtein = items.reduce((s, i) => s + i.protein_g, 0)
                    return (
                      <div key={date} className="border border-white/[0.06] rounded-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03]">
                          <span className="font-sans text-[11px] font-medium text-dn-white">{fmt(date)}</span>
                          <span className="font-sans text-[10px] text-dn-graphite tabular">
                            {dayTotal} kcal · {dayProtein.toFixed(0)}g protein · {items.length} items
                          </span>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                          {items.slice(0, 4).map((item, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-1.5">
                              <span className="font-sans text-[11px] text-dn-white/70 truncate max-w-[55%]">{item.food_name}</span>
                              <span className="font-sans text-[10px] text-dn-graphite tabular">
                                {item.calories} kcal · P:{item.protein_g.toFixed(0)}g
                              </span>
                            </div>
                          ))}
                          {items.length > 4 && (
                            <div className="px-4 py-1.5 font-sans text-[10px] text-dn-graphite">
                              +{items.length - 4} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Footer actions */}
            {parsed?.entries?.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] shrink-0">
                <div className="font-sans text-[11px] text-dn-graphite">
                  Entries will be appended — existing logs for these dates are preserved.
                </div>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-5 py-2 bg-dn-orange text-black font-sans font-semibold text-[12px] rounded-sm hover:-translate-y-px transition-all duration-150 disabled:opacity-50"
                >
                  {importing ? 'Importing…' : `Import ${parsed.entries.length} entries`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
