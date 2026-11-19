[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/sururarip/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/sururarip/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Solmar Cover Studio — GTA 6-style cover art maker

An offline web app that turns any photo and caption into GTA 6-style cover art: multi-panel poster layouts, bold Anton lettering with a Pacifico script subtitle, Vice City sunset and neon grades, exported as PNG in 1080×1080, 1080×1350 and 1920×1080.

Built for the [make.fun gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01).

## Run it

Serve `app/` with any static server (for example `node serve.ts`, then open http://localhost:8080). Everything runs offline in the browser; photos never leave the machine.

## How it works

- 5 layouts: Nine Grid, Hero + Three, Full Bleed, Tilted Snapshots, Four Panel
- 6 colour grades, halftone title block, ribbon badge, star heat meter, grain + vignette
- Per-panel crop and position (drag, wheel zoom, sliders), one photo or several
- Undo/redo, live preview, one-click PNG export in three post sizes

All artwork, lettering and sample photos are original. Fonts (Anton, Pacifico) are under the SIL Open Font License.
