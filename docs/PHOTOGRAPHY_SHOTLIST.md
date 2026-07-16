# HimBean Photography Shotlist

**Status (2026-07-07):** Real photography received and placed.
- **Static preview** (`himbean-v2-preview.html`): all 9 storytelling shots + 9 retail product
  shots are live (embedded), replacing every placeholder.
- **Next.js app**: HERO-01 is live at `/images/hero-01.jpg` via `ImagePlaceholder`'s new
  optional `src` prop (backward compatible — omit `src` and the labeled placeholder still
  renders exactly as before). Farmers/Flagship/Club/Visit/Footer are Planned sections in the
  app (not yet built — they currently exist only in the design preview); their photos are
  already saved to `public/images/` for when those sections are added.
- Per-drink MENU-* modal photography remains Planned — no shots were supplied for the 127
  individual drinks.

Every `<ImagePlaceholder shot="…">` in the codebase maps to a row here. Placeholders lock
aspect ratio (zero CLS on swap) and already carry final alt text. Replace with next/image
(AVIF/WebP, blur placeholder) at the listed resolution — layout will not change.

**Global look:** morning/golden window light, warm espresso-brown & cream palette with
forest-green and copper accents, shallow depth, real steam and real crema. Full-frame body
(Sony A7-class / Canon R5 / medium format), 35–85 mm primes, natural light + one bounce.
Never stock-looking; never over-retouched.

| ID | Subject & composition | Angle | Light | Ratio | Min. res |
|---|---|---|---|---|---|
| HERO-01 | Espresso pouring into cream ceramic cup, walnut counter, copper machine soft behind, real steam | 30° front, cup right-third | Morning window, volumetric | 4:5 | 1600×2000 |
| MENU-* (one per drink, start with the 20 Featured) | Finished drink in HimBean ceramic/glass; hot = visible steam; iced = condensation | Set of: hero 45°, top-down, macro crema/texture, lifestyle-in-hand | Window light + steam diffusion | 1:1 | 1200×1200 each |
| FARM-01..03 | Farmer portraits: Nuwakot / Lamjung / Gulmi partners among shrubs, terraced hillside behind | Eye-level, 85 mm, dignified | Morning mist, soft | 3:4 | 1200×1600 |
| FARM-04..08 | Harvest hands with cherries · drying beds · washing station · blossoms · terraced drone wide | Mixed documentary | Natural | 3:2 | 1800×1200 |
| STORE-01..04 | Flagship interior (bar, pour-over station) · exterior at dusk · barista mid-pour · guests, warm night ambience | Editorial hospitality | Warm tungsten + window | 3:2 | 1800×1200 |
| ROAST-01 | Beans in motion in the roaster drum, roast-log clipboard in hand | 45° close | Warm side light | 4:3 | 1600×1200 |
| FOOD-01..06 | Croissants at dawn · cinnamon roll glazing · cheesecake with honey pull · lemon cake slice · brownie stack · pastry case | Michelin-style, tight | Directional soft | 1:1 | 1200×1200 |
| RETAIL-01..03 | 250 g bags (espresso-brown, forest, caramel) with roast-date sticker · gift box · pour-over kit flat-lay | Front 3/4 product | Studio-soft daylight | 1:1 | 1500×1500 |

3D assets (later, optional): coffee-bag turntable (photogrammetry or 32-frame turntable at
RETAIL specs); keep under 300 KB per asset, lazy-loaded, reduced-motion fallback = static frame.
