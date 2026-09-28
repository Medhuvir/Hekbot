// Fails when component code steps outside the design system (docs/DESIGN_SYSTEM.md).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const RULES = [
  [/\btext-\[\d+px\]/, 'raw pixel font size — use a type token (text-body, text-caption, …)'],
  [/\btracking-\[[^\]]+\]|\btracking-(?:wide|wider|widest|tight|tighter)\b/, 'ad-hoc tracking — use tracking-label/button/display/hero'],
  [/\b(?:text|bg|border)-(?:white|black)(?:\/|\b)/, 'raw white/black — use dn-white/dn-black or a line/fill token'],
  [/\b(?:text|bg|border)-(?:red|green|blue|amber|yellow|orange|gray|zinc|neutral|slate|emerald|sky)-\d{2,3}\b/, 'off-palette hue — use dn-success/warning/danger or a brand token'],
  [/#[0-9A-Fa-f]{6}\b/, 'hex literal — import COLORS from src/lib/tokens.js'],
]
// Logo artwork and the token/vendor files themselves are exempt.
const EXEMPT = ['src/lib/tokens.js', 'src/lib/topo-motion.js', 'src/components/DNMark.jsx', 'src/components/OrderOfFireMedallion.jsx']

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (/\.(jsx?|css)$/.test(p)) yield p
  }
}

let problems = 0
for (const file of walk('src')) {
  if (EXEMPT.includes(file)) continue
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (file.endsWith('.css') && /^\s*(\/\*|\*)/.test(line)) return
    for (const [re, msg] of RULES) {
      if (re.test(line)) { problems++; console.log(`${file}:${i + 1}  ${msg}\n    ${line.trim().slice(0, 140)}`) }
    }
  })
}
if (problems) { console.log(`\n${problems} design-system violation(s).`); process.exit(1) }
console.log('Design system audit: clean.')
