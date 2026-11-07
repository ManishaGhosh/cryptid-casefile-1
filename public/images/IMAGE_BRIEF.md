# Cryptid Casefiles - Image Brief

The app works with **zero** images. Every slot has a finished-looking fallback, so you can add files one at a time, in any order. A missing or broken file never shows a broken-image icon and never shifts the layout.

Drop each file into the folder shown, using the **exact filename** in the tables below. No code changes are needed. Refresh the page and the image appears.

## Art direction (applies to every image)

- **Subject world:** a secret paranormal research bureau's archive. Documentary, forensic, "recovered from a locked filing cabinet" photography.
- **Look:** desaturated colour, cold blue-green shadows with warm tungsten highlights, visible film grain, slight vignette, soft focus on edges. 1970s-90s field photography (35 mm, flash-lit, or security-camera / thermal-imager capture where noted).
- **Palette to stay near:** near-black, aged parchment, muted forest green, antique gold, restrained blood red. Avoid saturated colour.
- **Creatures are never shown clearly.** Silhouettes, motion blur, half out of frame, behind foliage, in glare, in thermal noise. Never a clean monster portrait.
- **Do not include:** text, captions, watermarks, logos (except the emblem file), cartoon or Halloween clip-art styling, gore, blood, or jump-scare faces.
- **Spoilers:** images appear only after the player collects the evidence or unlocks the cryptid, but still avoid anything that names the answer in the picture itself.

## Technical specs

| Folder | Files | Dimensions | Aspect | Format | Max size |
|---|---|---|---|---|---|
| `brand/` | 1 | 512 x 512 | 1:1 | PNG, transparent background | ~300 KB |
| `cases/` | 3 | 1600 x 900 | 16:9 | WebP | ~300 KB each |
| `evidence/` | 12 | 1200 x 900 | 4:3 | WebP | ~300 KB each |
| `cryptids/` | 3 | 1000 x 1250 | 4:5 | WebP | ~300 KB each |

Other sizes work too (images are cropped to the slot with `object-cover`), but keep the aspect ratio and keep the important subject near the centre.

### How images are cropped

- **Cases (16:9):** shown in full on desktop; on phones the height is capped and the sides are cropped. Keep the subject central.
- **Evidence (4:3):** shown as a 4:3 thumbnail on the card and larger in the detail panel. Keep the subject central.
- **Cryptid plates (4:5):** see the cryptid section below. Keep the creature's key features in the central upper two-thirds, with some margin around it.

### Converting to WebP

Any of these work:

- Online: <https://squoosh.app> - choose WebP, quality 70-80, resize to the dimensions above, and check the size is under ~300 KB.
- Command line (libwebp installed): `cwebp -q 75 -resize 1600 900 input.png -o case-001-forest-watcher.webp`
- ImageMagick: `magick input.png -resize 1600x900^ -gravity center -extent 1600x900 -quality 75 case-001-forest-watcher.webp`

Cryptid archive-only entries (cryptid-004 The Pale Cartographer, cryptid-005 The Drowned Choir) are permanently locked in the MVP and need **no** image.

## Prompt style prefix

Prepend this to every prompt below for consistency:

> Documentary forensic archive photograph, 1980s 35mm film, heavy grain, desaturated, cold teal shadows with warm tungsten highlights, slight vignette, government paranormal research bureau evidence file, no text, no watermark, no cartoon, no gore.

## All 19 files

### Brand (1)

| # | File | Appears in | Subject | Prompt |
|---|---|---|---|---|
| 1 | `brand/fbci-emblem.png` (512x512, transparent PNG) | Sidebar brand mark, loading screen, orientation briefing | The bureau seal of the Federal Bureau of Cryptid Investigation: a round engraved metal or ink-stamped seal showing a stylised eye above an evergreen tree and a wavy water line, inside a double ring. Antique gold on transparent. Readable text is not required. | Circular government bureau seal, engraved antique-gold metal emboss, an all-seeing eye above a pine tree and wavy water lines inside a double ring with abstract tick marks, flat front view, centred, transparent background, no legible text, no gradients, subtle worn texture |

### Case field photographs (3) - 1600x900

Shown on the Case Detail incident report (as a clipped "field photograph") and in the final report, Section I.

| # | File | Case | Subject (from seed data) | Prompt |
|---|---|---|---|---|
| 2 | `cases/case-001-forest-watcher.webp` | Case 001, The Forest Watcher | Harrow Pines State Forest, Dunmore County, Oregon, at dusk. A trail leading into dense old-growth pines; far down the tree line a tall, narrow, motionless darker shape is just visible between trunks, mostly lost in fog. | Prefix + wide dusk shot of a trail in dense old-growth pine forest in Oregon, low fog, a very tall motionless silhouette barely visible between distant trunks, too far to make out, flash-less low light, tree line framing |
| 3 | `cases/case-002-hollow-lake.webp` | Case 002, The Hollow Lake | Voss Hollow Reservoir, Blackwater Ridge, Montana, early morning. Still grey water under mist; a faint blue-green glow pulsing beneath the surface a short way from the shore; a small fishing boat in the distance. | Prefix + cold early-morning reservoir in Montana ridge country, mist on still grey water, faint blue-green glow beneath the surface in rings, small fishing boat far off, long exposure feel |
| 4 | `cases/case-003-house-without-shadows.webp` | Case 003, The House Without Shadows | 14 Vanthorpe Lane, Greystone Falls, Vermont. A vacant two-storey clapboard house, porch visible; the porch and yard cast normal shadows but the lit windows show a strange flat, shadowless interior. | Prefix + vacant two-storey Vermont clapboard house at late afternoon, long normal shadows across the porch and lawn, the interior windows glowing flat and shadowless, empty street, eerie stillness |

### Evidence photographs (12) - 1200x900

Shown on the collected evidence card (thumbnail), in the evidence detail panel, and as report exhibits. Never shown while an item is locked.

| # | File | Evidence | Subject (from seed data) | Prompt |
|---|---|---|---|---|
| 5 | `evidence/ev-001-broken-branches.webp` | EV-001 Broken Branches | Pine limbs cleanly fractured at one consistent height (about twelve feet) along a half-mile of trail; a ranger's measuring pole beside one break. | Prefix + low-angle shot up a forest trail at snapped pine limbs all broken at the same height, a red-and-white measuring pole beside one fracture, evidence marker tag, overcast |
| 6 | `evidence/ev-002-thermal-anomaly.webp` | EV-002 Thermal Anomaly | Wildlife camera-trap thermal image, timestamp 02:17: a tall bipedal heat shape at the forest boundary, diffuse rather than sharp. | Prefix + grainy thermal-imager still of a forest edge at night, a tall diffuse bipedal heat blob standing between trees, false-colour palette muted to teal and amber, blurry, no readable text |
| 7 | `evidence/ev-003-missing-deer.webp` | EV-003 Missing Deer | An empty forest clearing with abandoned deer tracks leading away in every direction; a camera trap on a tree in the foreground. | Prefix + empty silent forest clearing, scattered deer tracks in soft soil all pointing away from the centre, a trail camera strapped to a tree in the foreground, grey morning light |
| 8 | `evidence/ev-004-resin-markings.webp` | EV-004 Resin Markings | Close-up of tree bark with fresh amber resin secreted in a repeating spiral pattern. | Prefix + macro close-up of pine bark with glossy fresh amber resin flowing in a precise repeating spiral pattern, a ruler for scale at the edge, flash photography |
| 9 | `evidence/ev-005-bioluminescent-residue.webp` | EV-005 Bioluminescent Residue | Glass sample jars on a field bench containing glowing blue-green organic matter, pulsing. | Prefix + laboratory sample jars on a dark field bench holding glowing blue-green gelatinous matter, light is the only illumination, forensic labels (no legible text), slight glare |
| 10 | `evidence/ev-006-sonar-anomaly.webp` | EV-006 Sonar Anomaly | A survey-boat sonar display showing a large coherent mass at 25 m depth. | Prefix + photograph of a green-phosphor sonar monitor aboard a survey boat showing a huge round soft-edged mass below the surface trace, depth rings, reflected window glare, no legible text |
| 11 | `evidence/ev-007-temperature-record.webp` | EV-007 Temperature Record | A monitoring buoy on the reservoir and a chart-recorder printout with a sharp temperature plunge. | Prefix + a yellow monitoring buoy on grey still water in early morning with mist rising, inset-style strip chart paper with a sharp drop in the line, instrument hardware, cold light |
| 12 | `evidence/ev-008-submerged-structure.webp` | EV-008 Submerged Structure | Underwater survey photo of arranged stone columns on the lakebed, partly covered by glowing organic film. | Prefix + murky underwater survey photograph of regularly arranged ancient stone columns on a lakebed, faint blue-green luminescent film clinging to them, diver's light cone, silt in suspension |
| 13 | `evidence/ev-009-shadow-absence.webp` | EV-009 Shadow Absence | A control comparison: the same object (a chair or cardboard box) lit hard by a torch indoors with no shadow, next to an exterior porch shot with a normal shadow. | Prefix + split-frame contact-sheet style photo: left, a box on a wooden floor hit by a harsh torch beam with no shadow at all; right, the same box on a porch with a long normal shadow; scale ruler |
| 14 | `evidence/ev-010-electromagnetic-disturbance.webp` | EV-010 Electromagnetic Disturbance | An EMF meter in an investigator's hand in a bare upstairs bedroom, needle pinned at maximum. | Prefix + hand holding a handheld EMF meter with the needle pinned to the far end in an empty upstairs bedroom with peeling wallpaper, flash-lit, dial legible only as shape |
| 15 | `evidence/ev-011-cold-geometry.webp` | EV-011 Cold Geometry | Thermographic image of a room showing perfectly geometric cold zones: two rectangles and two circles. | Prefix + thermographic image of a room interior in muted blue-and-amber false colour showing two sharp-edged cold rectangles and two cold circles unrelated to walls or windows, grainy, no text overlay |
| 16 | `evidence/ev-012-mirror-reflection.webp` | EV-012 Mirror Reflection | An upstairs mirror: the reflected room is the same but the chair is in the wrong position and a window appears bricked up. | Prefix + a tall old mirror in an upstairs room reflecting the same room with a chair in a different place and a window shown bricked up, dust and low window light, photographer's flash glint kept off-centre |

### Cryptid specimen plates (3) - 1000x1250

Shown on the unlocked Archive card, the dossier, and the report determination. Never shown while a cryptid is locked or sealed. Treat these as bureau "specimen plates": field evidence, still obscured.

How a plate is used (keep dimensions 1000x1250):

- **Dossier:** the full 4:5 portrait, beside the description on tablets and desktops, capped in height on phones.
- **Archive card:** a 4:3 crop centred slightly above the middle (about 30% from the top), so the lower part is lost.
- **Report:** a small thumbnail.

So keep the creature's key features in the central upper two-thirds of the frame and leave some margin around it.

| # | File | Cryptid | Subject (from seed data) | Prompt |
|---|---|---|---|---|
| 17 | `cryptids/cryptid-001-the-warden.webp` | The Warden | Bipedal bark-and-wood figure, 9-10 ft, amber resin glow in a flat bark face; only partly seen between trunks, motionless. | Prefix + vertical shot at night of a very tall motionless humanoid figure made of bark and living wood with branch-like limbs and two faint amber eyes, half hidden behind pine trunks and fog, shot from a distance, never a clear portrait |
| 18 | `cryptids/cryptid-002-the-hollow.webp` | The Hollow | Distributed colony of fist-sized bioluminescent nodes in a loose lattice through deep water. | Prefix + vertical underwater shot looking down into black water, thousands of small blue-green glowing nodes forming a loose three-dimensional lattice that fades into depth, motion blur, no single body |
| 19 | `cryptids/cryptid-003-the-unlit.webp` | The Unlit | An absence: a region where light does not behave, in a domestic interior. Seen only through its effects. | Prefix + vertical shot of an ordinary dim domestic hallway with a soft rectangular region at the end where the light simply stops and nothing is visible, objects near it with no shadows, faint EMF-distorted film artefacts, no creature visible |
