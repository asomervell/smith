# Release Notes - v1.0.0

## Initial Chrome Web Store release

Markdown Reader Mode v1.0.0 introduces a markdown-first reader experience for websites that support `Accept: text/markdown`.

### Included in this release

- MV3 extension runtime with content-script markdown negotiation
- Reader UI with isolated Shadow DOM styling
- Fixed top-right `View HTML` button
- One-navigation bypass behavior back to native HTML
- Frontmatter stripping and escaped-character-safe markdown parsing
- Duplicate-link suppression for cleaner output
- Suppression of markdown image tokens and alt text
- Unit + Playwright E2E tests
- Release packaging script outputting `dist/markdown-reader-extension.zip`

### Validation run

- `npm run lint`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build:zip`
