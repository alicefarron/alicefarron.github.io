---
paths:
  - "src/**/*.{astro,ts,tsx,css}"
  - "tests/**/*"
---

# Code rules

- `.astro` components by default. `.tsx` islands only when the component needs client state; keep them small and hydrate with `client:visible` or `client:idle`.
- One component per file, PascalCase names. Routes and content files in kebab-case.
- Typed props. No `any`, no non-null assertions to silence the compiler.
- Styling through tokens and Tailwind utilities. A custom CSS rule needs a reason in the plan.
- Use container query units (`cqi`) for sizes that depend on the page width, never `vw`.
- Pixel sprites live in `src/sprites/` as string grids and render at build time to inline SVG with `shape-rendering="crispEdges"`, merging horizontal runs into single rects. Never a grid of divs.
- Interactive controls are real `<button>` or `<a href>`. Toggles use `aria-pressed`. Islands render a usable no-JS state.
- Every route gets an axe check and visual snapshots at 390, 820 and 1280 px in `tests/e2e/`.
