# TODOS

## [Security] Add markdown escaping regression fixtures after harness setup

- **What:** Add adversarial markdown fixtures and regression tests to ensure raw HTML in markdown is escaped/dropped under the text-first rendering model.
- **Why:** This was explicitly deferred during `/plan-eng-review`; without a tracked follow-up, parser configuration can drift and re-enable unwanted HTML rendering behavior.
- **Pros:** Locks the text-first rendering contract with repeatable tests and protects against accidental parser-option regressions.
- **Cons:** Adds maintenance overhead for fixture curation and expected-output updates.
- **Context:** The repo currently has no test harness. The review decision was to add Playwright + unit harness now, then add these escaping fixtures immediately after v1 demo.
- **Depends on / blocked by:** Requires baseline test harness and core markdown render pipeline to exist.

## [Design] Define responsive + accessibility behavior matrix for reader mode

- **What:** Specify desktop/tablet/mobile layout behavior and keyboard/screen-reader interaction expectations for reader mode and fallback controls.
- **Why:** `/plan-design-review` left responsive behavior intentionally unresolved; without a tracked follow-up, mobile and assistive UX can drift during implementation.
- **Pros:** Preserves readability and control discoverability across viewports, reduces rework from post-build UX fixes.
- **Cons:** Adds extra design-spec work before the feature can be considered fully UX-complete.
- **Context:** Information architecture and state contract are now locked; responsive behavior is the remaining high-impact ambiguity.
- **Depends on / blocked by:** Can be completed before implementation or immediately after the first UI spike with real screenshots.
