# ClipVault

A local snippet manager: save text snippets with tags, search everything, and re-copy with one click.

## Features

- Save snippets via textarea (Ctrl+Enter shortcut) with comma-separated tags
- Full-text search across snippet text + tags
- Tag cloud filter — click any tag to filter, click again to clear
- One-click re-copy with flash feedback and per-snippet copy counter
- Add tags to existing snippets, delete, relative timestamps
- Clipboard API with `execCommand` fallback for non-secure contexts
- Sample data loader; everything persisted to localStorage

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## License

MIT
