# Privacy Policy - Markdown Reader Mode

Last updated: 2026-04-27

Markdown Reader Mode is designed to minimize data collection.

## What data we collect

We do not collect personal data, analytics events, account information, browsing history archives, or telemetry.

## What data we process

To render markdown reader mode, the extension:

- reads the current page URL
- requests that same URL with `Accept: text/markdown`
- stores a short-lived tab bypass flag when you click `View HTML`

This data is processed locally in your browser and is not sent to our servers.

## Data sharing

We do not sell, rent, or transfer user data to third parties.

## Data retention

The tab bypass value is temporary and only used to handle one navigation back to HTML mode.

## Security

The extension uses Chrome extension permissions and runs in the browser sandbox. The rendered reader UI is isolated from page CSS via Shadow DOM.

## Contact

For questions, open an issue at:

https://github.com/asomervell/smith/issues
