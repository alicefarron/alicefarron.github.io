# 003: Site polish

Status: approved
Owner: Alina

## Why

Small fixes after the first look at the built site: the browser tab has no icon, the subscribe copy reads as if the digest were daily, the subscribe dialog has a button that does nothing useful, there is no way to get Alina's CV, and the meow.app window does not react to petting the way the approved design does.

## Scope

Favicon, subscribe copy and buttons, a CV link on About, the meow.app background change, and filling the contact details Alina has already chosen.

## Out of scope

Hosting the CV on the site. The CV stays on Google Drive.

## Requirements

R1. Every page has a favicon: the pixel cat head from the `cat` sprite, ink and white on a yellow square, as an SVG icon plus a 32 px PNG fallback and a 180 px Apple touch icon, all generated at build time from the sprite grid.

R2. The subscribe copy says the digest is weekly. Both subscribe variants read "One issue a week, every Monday." followed by the tagline highlight. `site.digestDay` is "Monday".

R3. The subscribe dialog on Home has no "Not now" button. The Subscribe button stays, aligned right.

R4. About has a "CV" link next to Email, GitHub and LinkedIn, pointing to https://drive.google.com/file/d/1K4zLioaxgYTVEnET1auOg1ME8npQxxWB/view?usp=sharing. It opens in a new tab with `rel="noopener"` and its accessible name says it opens Google Drive.

R5. After the first press of "Pet the cat", the meow.app window body changes from white to a pale pink and stays pink. The color is a new token `pet-blush` (#FFF6F9 from the approved design). Text on it keeps AA contrast. Without JavaScript the window stays white.

R6. Contact details are real values, not placeholders: email `shaimievaalinas@gmail.com`, LinkedIn `https://www.linkedin.com/in/alina-shaimieva-5043a4233/`.

## Acceptance criteria

AC1 (R1). Given a production build, then every page's head links `/favicon.svg`, `/favicon-32.png` and `/apple-touch-icon.png`, and all three files exist in `dist/` with the expected sizes.
AC2 (R2). Given Home and an issue page, then the subscribe text contains "One issue a week, every Monday." and no page contains "[DAY]" or "every [".
AC3 (R3). Given Home, then the subscribe dialog has exactly one button and no "Not now" text.
AC4 (R4). Given About, then a link named "CV" has the Drive URL, `target="_blank"` and `rel` containing `noopener`.
AC5 (R5). Given Home with JavaScript, when "Pet the cat" is pressed once, then the meow.app body has the `pet-blush` background; pressing again keeps it. Given no JavaScript, the body is white. Unit test on the island and a Playwright check.
AC6 (R6). Given About, then the Email link is `mailto:shaimievaalinas@gmail.com` and the LinkedIn link is the URL in R6, with no square brackets anywhere in either.

## Open questions

None.
