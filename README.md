# frane.bandov.net

Personal website. Static site built from Markdown.

## Usage

```bash
npm install
npm run build    # outputs to public/
npm run serve    # preview locally
```

## Deploy

Push `public/` to any static host:
- **GitHub Pages** — use a GitHub Action that runs `npm run build` and deploys `public/`
- **Netlify** — set build command to `npm run build`, publish directory to `public`
- **Cloudflare Pages** — same as Netlify
