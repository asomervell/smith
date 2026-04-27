# Chrome Web Store Submission Checklist (v1.0.0)

## Package

- [ ] `manifest.json` version is `1.0.0`
- [ ] Run `npm run lint`
- [ ] Run `npm run test:unit`
- [ ] Run `npm run test:e2e`
- [ ] Run `npm run build:zip`
- [ ] Confirm zip exists at `dist/markdown-reader-extension.zip`

## Store Listing

- [ ] Paste summary and full description from `CWS_LISTING.md`
- [ ] Set category to `Productivity`
- [ ] Set support URL
- [ ] Set homepage URL

## Privacy + Compliance

- [ ] Publish `PRIVACY_POLICY.md` at a public URL (GitHub Pages, gist, docs site)
- [ ] Add that public URL in the Web Store privacy field
- [ ] Complete data usage form as "no data collected"
- [ ] Confirm host permission rationale references markdown negotiation behavior

## Assets

- [ ] Upload extension icon assets required by Chrome Web Store
- [ ] Upload screenshots (at least one)
- [ ] Optional: upload promotional tile assets

## Release

- [ ] Upload `dist/markdown-reader-extension.zip` in Developer Dashboard
- [ ] Submit for review as Unlisted or Public
- [ ] After approval, verify live listing and install path
