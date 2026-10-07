# Digest reference

Details the digest skill points to. The procedure itself is in `SKILL.md`.

## Run ledger

The ledger is `.digest/NNN.json` (git-ignored). Keep it up to date while you work, not at the end. `check-ledger`, `check-issue` and `pr-body` read it, so the PR body always shows what was checked.

```json
{
  "number": 14,
  "runDate": "2026-10-12",
  "window": { "start": "2026-10-06", "end": "2026-10-12" },
  "sourcesChecked": [
    { "url": "https://www.anthropic.com/news", "note": "2 candidates" }
  ],
  "opened": ["https://www.anthropic.com/news/example-post"],
  "items": [
    {
      "section": "Models",
      "headline": "Headline in your own words",
      "sourceName": "Anthropic",
      "url": "https://www.anthropic.com/news/example-post",
      "publishedDate": "2026-10-07",
      "dateEvidence": "Oct 7, 2026",
      "takeaway": "One sentence for an engineer who ships AI features."
    }
  ],
  "dropped": [
    {
      "headline": "Some other post",
      "url": "https://example.com/post",
      "reason": "outside window: 2026-10-02"
    }
  ],
  "quote": null
}
```

Fields:

- `number`, `runDate`, `window`: copied from `node scripts/digest.ts context`.
- `sourcesChecked`: one entry per URL in `sources.md`, using the URL exactly as listed there, plus any extra pages you scanned. `note` says what you found, for example `no posts in window`, `2 candidates`, `failed to load: 503`.
- `opened`: every page you opened with WebFetch during this run, as opened. Every item URL and the quote URL must be in this list.
- `items`: only items you keep. `section` is one of `Models`, `Tooling`, `Agents`, `Papers`. `url` is the page you opened and read the date on. `publishedDate` is that date as `YYYY-MM-DD`. `dateEvidence` is the date text exactly as the page prints it. `headline` and `takeaway` are the same text you put in the issue.
- `dropped`: every candidate you looked at and did not keep, with a short reason: `outside window: 2026-10-02`, `no date on page`, `page did not load`, `already in issue 013 (same announcement)`, `not useful for engineers shipping AI features`, `section full`, `over 10 items`.
- `quote`: `null`, or `{ "text", "author", "role", "url" }` copied exactly from one opened page (see the quote rule in `SKILL.md`).

## PR body

`node scripts/digest.ts pr-body` writes it from the ledger and the issue file. Do not write it by hand or edit it afterwards. It has these sections, in this order:

- Items: number, section, headline, source link, date on page.
- Quote: the quote in double quotes, then author and role in brackets and the URL, or "None".
- Dropped: each dropped candidate with its reason.
- Sources checked: each source with its note.
- Author markers left: every `[ALINA: ...]` marker with its line.
- Checks: check-issue, pnpm check, render-check.
- Before merging: Alina's checklist.

## Writing in MDX

- Attribute values in `headline` and `source` are inside double quotes, so they must not contain `"`. Rephrase, or use single quotes inside.
- Do not use `{`, `}`, `<` or `>` in the intro or takeaways; MDX reads them as code. Write "less than" or rephrase.
- Keep each takeaway on one line between `<Item ...>` and `</Item>`.
- `title` and `lede` are YAML strings in double quotes. `date` is unquoted `YYYY-MM-DD`.
