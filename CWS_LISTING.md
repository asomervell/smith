# Chrome Web Store Listing (v1.0.0)

Use this content in the Chrome Web Store Developer Dashboard when creating or updating the listing.

## Product name

Markdown Reader Mode

## Summary (short description)

Instantly switches supported pages to a clean markdown reader view, with one-click fallback to original HTML.

## Full description

Markdown Reader Mode asks pages for markdown content using:

`Accept: text/markdown`

If a site supports markdown responses, the extension renders a fast, minimal reader view focused on content and readability.

If markdown is not supported, the page stays unchanged.

### Key behaviors

- Auto-detects markdown support on each page load
- Renders a clean reader interface with isolated styling
- Keeps a fixed top-right `View HTML` button
- `View HTML` reloads the original page for that navigation
- Avoids noisy repeated duplicate links in markdown output
- Handles frontmatter and escaped markdown characters safely

### Permissions

- `activeTab`: used to act on the currently viewed page
- `storage`: used to store one-time tab bypass state for `View HTML`
- `scripting`: required for extension content script behavior
- Host permissions (`http://*/*`, `https://*/*`): required to request page markdown responses from visited pages

### Data use

The extension does not collect analytics, does not sell data, and does not send user data to third-party servers.

## Category suggestion

Productivity

## Support URL

https://github.com/asomervell/smith

## Homepage URL

https://github.com/asomervell/smith
