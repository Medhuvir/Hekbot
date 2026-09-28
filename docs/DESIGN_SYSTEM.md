# HekBot Design System

HekBot follows the DN Creative brand (Pitch Black / Warm White / Blaze Orange,
Bebas Neue + DM Sans). Every value lives in [`src/lib/tokens.js`](../src/lib/tokens.js);
`tailwind.config.js` builds its theme from it, and charts import it directly.

Run `npm run design:audit` before committing UI work. It fails on raw pixel
sizes, bracketed tracking, raw white/black opacity classes, off-palette
Tailwind hues and hex literals in components.

## Type

Two families, eight sizes. Nothing below 13px.

| Token | Size | Family | Role |
|---|---|---|---|
| `text-hero` | 36–52px fluid | Bebas | The one page headline (HekBot greeting) |
| `text-display-lg` | 48px | Bebas | A single featured number per view (progress %) |
| `text-display-md` | 32px | Bebas | Page-level wordmarks, primary metric in a card |
| `text-display-sm` | 24px | Bebas | Stat values, names, panel titles |
| `text-display-xs` | 18px | Bebas | Card titles, inline figures inside body text |
| `text-body` | 16px | DM Sans | Default: sentences, values, inputs, buttons, page section headings |
| `text-caption` | 14px | DM Sans | Secondary text, meta, helper text, **uppercase labels** |
| `text-label` | 13px | DM Sans | Badges and micro labels only |

**Hierarchy rules**

1. Bebas is display only — never for sentences. DM Sans is never above `text-body`.
2. A label is always smaller than the value it names: uppercase labels use
   `text-caption` (or `text-label` for badges), the value uses `text-body` or a display size.
3. Uppercase DM Sans always takes `tracking-label` (buttons: `tracking-button`).
   Lowercase text is never letter-spaced.
4. Bebas takes `tracking-display`; `text-hero` takes `tracking-hero`.
5. One `text-display-lg` / `text-hero` per view.
6. On phones, form fields render at 16px (set globally) so iOS doesn't zoom.

## Color

| Token | Use |
|---|---|
| `dn-white` | Primary text |
| `dn-gray-light` | Secondary text (the only other text grey) |
| `dn-graphite` | Placeholders and non-text strokes only — fails AA as text |
| `dn-orange` | The accent: CTAs, active states, one focal point per surface |
| `dn-orange-light` | Hover state of anything orange |
| `dn-black` | Page background; text on orange |
| `dn-surface-dark` → `dn-surface` | Card gradient (top → 65%) |
| `dn-gray-mid` | Neutral bubble fills |
| `dn-line` / `dn-line-strong` | Borders and dividers / rules that must read (dashed add buttons) |
| `dn-fill` / `dn-fill-strong` | Inputs and inset panels / tracks, chips, hover fills |
| `dn-tint` | Orange wash for tags, highlights and hover on orange-outlined controls |
| `dn-orange/30` → `dn-orange/60` | Orange border at rest → on focus/hover |
| `dn-success` · `dn-warning` · `dn-danger` | Status meaning only (on track / partial / low, errors). Never decoration |

**Rules**

1. No raw hex or `white/`/`black/` opacity classes in components — use a token.
2. Orange is a signal: one focal element per surface.
3. Text must meet WCAG AA (4.5:1). Don't fade text with opacity; use `dn-gray-light`.
4. Macro colors (`src/lib/macroColors.js`) are tonal neutrals so the one orange
   stays with calories; each is AA-safe because they're also used as text.

## Components

- **Cards** — `.dn-card`: gradient surface, `dn-line` border, orange top edge on hover.
- **Buttons** — `.btn-primary` (orange fill) and `.btn-secondary` (orange outline),
  16px semibold uppercase with `tracking-button`. Add `.btn-sm` for compact
  inline buttons. Width/margins stay on the element.
- **Live topo** — `<LiveTopo overlay={OVERLAYS.header | OVERLAYS.form} />`: the
  DN live topographic generator at brand intensity. Header band and auth pages
  only; readability comes from the overlay, never from fading the topo.
