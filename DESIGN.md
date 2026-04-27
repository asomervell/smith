# DESIGN

## Purpose
Design baseline for the markdown-reader extension so implementation stays consistent and intentionally minimal.

## Core Principles
- Clarity first: prioritize readable content over UI chrome.
- Reversible interaction: user can always return to normal HTML in one obvious action.
- Explicit over decorative: avoid ornamental elements that do not improve comprehension.

## Typography
- Title: 32px / 1.2 / 700
- Body: 18px / 1.65 / 400
- Metadata + utility: 13px / 1.4 / 500

## Spacing
- Scale: 8, 12, 16, 24, 32 px
- Main reading column max width: 760px
- No ad hoc spacing values outside this scale without explicit justification.

## Color and Contrast
- Body text contrast: at least 7:1.
- Utility/control text contrast: at least 4.5:1.
- Focus indicators must remain clearly visible at all times.

## Interaction Patterns
- `View HTML` control is always visible in the top-right of reader mode.
- Minimum interactive target size: 44px.
- Keyboard navigation is required for primary controls.

## Anti-Patterns
- No decorative card grids.
- No center-aligned everything layouts.
- No decorative gradients/blobs for visual filler.
