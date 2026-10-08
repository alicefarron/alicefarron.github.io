# 003: Plan

- Favicon (R1): a small build-time script or Astro endpoint renders the cat sprite grid through the existing sprite-to-SVG renderer onto a yellow square. `src/pages/favicon.svg.ts` serves the SVG; the PNGs are rendered with `@resvg/resvg-js`, already a dependency (used for OG images), from `src/pages/favicon-32.png.ts` and `src/pages/apple-touch-icon.png.ts`. `Seo.astro` adds the three `<link>` tags. Head of the cat only: crop the sprite to its top rows if the full cat is unreadable at 16 px; decide by rendering both and keeping the clearer one.
- Subscribe copy (R2): `SubscribeForm.astro` lede becomes `One issue a week, every ${site.digestDay}.` plus the tagline highlight; `site.digestDay = "Monday"`.
- Not now (R3): remove the `data-not-now` link and any test or e2e check that expects it.
- CV (R4): add `cv` to `site` in `src/lib/site.ts`; About renders it in the contact list with `target="_blank" rel="noopener"` and an accessible name such as "CV (opens Google Drive)".
- Pet blush (R5): add `--color-pet-blush: #FFF6F9` to tokens. `PetButton` sets a `data-petted` attribute on the closest `[data-window="meow"]` body after the first press (or the island owns the body background through a wrapper); CSS `[data-petted] { background: var(--color-pet-blush) }`. Contrast ink on #FFF6F9 is far above 4.5:1.
- Contacts (R6): Alina has an uncommitted local edit of `src/lib/site.ts` with these values in square brackets and the file reformatted with spaces. The orchestrator replaces that working copy change with a clean edit in tab indentation (Biome) holding the values without brackets, so her values land and `pnpm check` passes.
- No new dependencies.
