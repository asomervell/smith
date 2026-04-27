# Markdown Reader Extension

Lightweight Chrome extension that requests pages with `Accept: text/markdown` and renders markdown in a clean reader layout when supported.

## How It Works

- On each page load, the content script fetches the same URL with `Accept: text/markdown`.
- If the response content type starts with `text/markdown`, the extension renders a markdown reader view.
- If the site does not support markdown (or fetch fails), it leaves the page unchanged.
- `View HTML` sets a one-time tab bypass and reloads back to original HTML.

## Local Use

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository.

## Development

- `npm install`
- `npm run lint`
- `npm test`
- `npm run test:e2e` (requires Playwright browser install)

## Packaging

- `npm run build:zip`
- Output: `dist/markdown-reader-extension.zip`
