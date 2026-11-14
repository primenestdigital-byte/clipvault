import React, { useMemo, useRef, useState } from 'react'

const KEY = 'clipvault-clips'
const SAMPLE = [
  { id: 1, text: 'git rebase -i HEAD~3', tags: ['git', 'cli'], copied: 3, when: Date.now() - 86400e3 * 2 },
  { id: 2, text: 'SELECT id, email FROM users WHERE created_at > NOW() - INTERVAL 30 DAY;', tags: ['sql'], copied: 1, when: Date.now() - 86400e3 },
  { id: 3, text: 'Best pixel ratio for retina: width / devicePixelRatio', tags: ['css', 'tip'], copied: 0, when: Date.now() - 3600e3 * 5 },
]

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (Array.isArray(d)) return d
  } catch { /* ignore */ }
  return SAMPLE
}

const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function App() {
  const [clips, setClips] = useState(load)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [newText, setNewText] = useState('')
  const [newTags, setNewTags] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const textRef = useRef(null)
  const idRef = useRef(Date.now())

  const persist = (next) => {
    setClips(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const allTags = useMemo(() => {
    const t = new Set()
    for (const c of clips) for (const tag of c.tags) t.add(tag)
    return [...t].sort()
  }, [clips])

  const filtered = useMemo(() => {
    let out = clips
    if (activeTag) out = out.filter(c => c.tags.includes(activeTag))
    if (query.trim()) {
      const q = query.toLowerCase()
      out = out.filter(c =>
        c.text.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return [...out].sort((a, b) => b.when - a.when)
  }, [clips, query, activeTag])

  const addClip = (e) => {
    e.preventDefault()
    const text = newText.trim()
    if (!text) return
    const tags = newTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    persist([{ id: ++idRef.current, text, tags, copied: 0, when: Date.now() }, ...clips])
    setNewText(''); setNewTags('')
    textRef.current?.focus()
  }

  const copyClip = async (id, text) => {
    try { await navigator.clipboard.writeText(text) } catch {
      // fallback for non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = text; document.body.appendChild(ta)
      ta.select(); document.execCommand('copy'); ta.remove()
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 700)
    setClips(c => {
      const next = c.map(x => x.id === id ? { ...x, copied: (x.copied || 0) + 1 } : x)
      // don't persist copy count on every click — but it's nice; do persist
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  const deleteClip = (id) => persist(clips.filter(c => c.id !== id))
  const addTag = (id, tag) => {
    const t = prompt('add tag:', '').trim().toLowerCase()
    if (!t) return
    persist(clips.map(c => c.id === id && !c.tags.includes(t) ? { ...c, tags: [...c.tags, t] } : c))
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-5 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Clip<span style={{ color: 'var(--accent)' }}>Vault</span></h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{clips.length} snippets · stored locally</p>
        </div>
        <button className="text-xs" style={{ color: 'var(--muted)' }}
          onClick={() => persist(SAMPLE.map((s, i) => ({ ...s, id: ++idRef.current })))}>
          load samples
        </button>
      </header>

      {/* new snippet */}
      <form onSubmit={addClip} className="panel mb-4 p-4 space-y-2">
        <textarea
          ref={textRef}
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') addClip(e) }}
          placeholder="paste a snippet… (Ctrl+Enter to save)"
          className="mono w-full resize-y rounded-lg border bg-transparent p-3 text-sm outline-none"
          style={{ borderColor: 'var(--border)', minHeight: 70 }}
        />
        <div className="flex gap-2">
          <input
            value={newTags}
            onChange={e => setNewTags(e.target.value)}
            placeholder="tags (comma separated)"
            className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-xs outline-none"
            style={{ borderColor: 'var(--border)' }}
          />
          <button type="submit"
            className="rounded-lg px-5 py-2 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#0f1418' }}>
            save
          </button>
        </div>
      </form>

      {/* search + tag filter */}
      <div className="mb-4 space-y-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="search snippets and tags…"
          className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)' }}
          aria-label="Search snippets"
        />
        <div className="flex flex-wrap gap-1.5">
          {allTags.map(t => (
            <button key={t} className={`tag ${activeTag === t ? '' : 'opacity-70'}`}
              style={activeTag === t ? { outline: '1px solid var(--accent)' } : undefined}
              onClick={() => setActiveTag(a => a === t ? null : t)}>
              #{t}
            </button>
          ))}
          {activeTag && (
            <button className="text-xs" style={{ color: 'var(--muted)' }} onClick={() => setActiveTag(null)}>
              clear filter ✕
            </button>
          )}
        </div>
      </div>

      {/* clips */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="panel p-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {clips.length === 0 ? 'nothing saved yet' : 'no matches'}
          </p>
        )}
        {filtered.map(c => (
          <article key={c.id} className={`clip-card clip-in panel p-4 ${copiedId === c.id ? 'copy-flash' : ''}`}>
            <p className="snippet-text mono text-sm">{c.text}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {c.tags.map(t => (
                <button key={t} className="tag" onClick={() => setActiveTag(a => a === t ? null : t)}>#{t}</button>
              ))}
              <span className="flex-1" />
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                {timeAgo(c.when)}{c.copied ? ` · copied ${c.copied}×` : ''}
              </span>
              <button onClick={() => addTag(c.id)}
                className="text-[10px] opacity-60 hover:opacity-100" style={{ color: 'var(--muted)' }}>+tag</button>
              <button onClick={() => copyClip(c.id, c.text)}
                className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                {copiedId === c.id ? '✓ copied' : 'copy'}
              </button>
              <button onClick={() => deleteClip(c.id)}
                className="text-xs" style={{ color: 'var(--muted)' }} aria-label="Delete snippet">✕</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
