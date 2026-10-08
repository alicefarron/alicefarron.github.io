# 003: Tasks

- [ ] T01 Contact details, CV link value and digestDay in site.ts
  Files: src/lib/site.ts
  Verify: AC6 unit test; `pnpm check`
- [ ] T02 Weekly subscribe copy and no "Not now" button
  Files: src/components/SubscribeForm.astro, tests touching the subscribe form
  Verify: AC2, AC3 build tests
- [ ] T03 CV link on About
  Files: src/pages/about.astro, tests
  Verify: AC4 build test
- [ ] T04 Pet blush token and background after the first pet
  Files: src/styles/tokens.css, src/islands/PetButton.tsx, src/components/PetWindow.astro, tests
  Verify: AC5 unit test, Playwright spec written
- [ ] T05 Favicon from the cat sprite
  Files: src/pages/favicon.svg.ts, src/pages/favicon-32.png.ts, src/pages/apple-touch-icon.png.ts, src/components/Seo.astro, tests
  Verify: AC1 build test; look at the 32 px PNG

## AC coverage

| AC | Tasks |
|---|---|
| AC1 | T05 |
| AC2 | T01, T02 |
| AC3 | T02 |
| AC4 | T01, T03 |
| AC5 | T04 |
| AC6 | T01 |
