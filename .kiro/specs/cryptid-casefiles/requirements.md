# Requirements Document

## Introduction

Cryptid Casefiles is a browser-based interactive supernatural investigation application built for the Kiroween hackathon (Costume Contest category). Players act as investigators for a fictional secret paranormal research bureau, working through classified cases, discovering evidence, connecting clues on an investigation board, identifying unknown cryptids, and filing final investigation reports. The application runs entirely client-side with no backend or authentication, persisting progress to LocalStorage. The tech stack is React + Vite + TypeScript, Tailwind CSS, React Router, Zustand, Framer Motion, React Flow, and Lucide React icons.

### MVP Scope

The following features are **in scope** for the MVP:

- Bureau Headquarters dashboard listing all cases and investigator status
- Three playable cases: Case 001 (The Forest Watcher), Case 002 (The Hollow Lake), Case 003 (The House Without Shadows)
- Case detail / incident report view per case
- Evidence discovery and collection (twelve total evidence items distributed across the three cases)
- Interactive investigation board (React Flow canvas) where users connect evidence nodes
- Cryptid identification triggered by collected evidence
- Cryptid encyclopedia with five original cryptids (discovered vs. undiscovered state)
- Final investigation report with listed evidence and a confidence score
- LocalStorage persistence of all investigator progress

The following features are **explicitly excluded** from MVP:

- User accounts, authentication, or cloud sync
- Real-time multiplayer or shared sessions
- External AI/API dependencies for identification logic
- More than three cases or five cryptids at launch
- Audio / sound effects
- Mobile-optimised layout beyond basic responsiveness
- Exportable or printable reports

---

## Glossary

- **Bureau**: The fictional secret paranormal research organisation the player represents.
- **Case**: A self-contained paranormal investigation scenario with an incident report, evidence items, and a correct cryptid answer.
- **Cryptid**: One of five original supernatural entities in the game, each with an associated evidence set and a dossier entry in the Archive.
- **Evidence Item**: A collectible field report artifact associated with a case; identified by a unique ID (EV-001 through EV-012).
- **Investigation Board**: The React Flow canvas where players place collected evidence as nodes and draw connections between them.
- **Hypothesis**: The player's selection of a suspected cryptid before submitting an identification.
- **Confidence Score**: A percentage score calculated from the overlap between the player's collected evidence and the selected cryptid's associated evidence set.
- **Archive**: The Cryptid Archive — a gallery of all five cryptid dossiers, locked until correctly identified.
- **Persistence_Layer**: The application module responsible for reading from and writing to LocalStorage.
- **Evidence_Store**: The Zustand store slice managing evidence collection and observation notes.
- **Case_Store**: The Zustand store slice managing case status (New, In Progress, Closed).
- **Report_Store**: The Zustand store slice managing filed investigation reports.
- **Identification_Engine**: The module that runs deterministic matching logic when a player submits a hypothesis.
- **Dashboard**: The Bureau Headquarters screen listing all cases and the investigator summary.
- **Case_Detail_View**: The per-case screen showing the incident report, witness statements, and evidence slots.
- **Evidence_Panel**: The overlay or drawer showing full details and the observation note input for a collected evidence item.
- **Hypothesis_Panel**: The UI area where the player selects a suspect cryptid and triggers submission.
- **Investigation_Report**: The final document generated when a player files a correct identification, stored per case.

---

## Section 1 — User Journey

The player's experience follows a linear-but-revisitable investigation loop that mirrors the workflow of a real field investigator.

**1. Enter Bureau Headquarters**
The player lands on the Bureau Headquarters dashboard, which presents a summary of their investigator profile and a grid of case cards. Each card displays the case ID, classification level, case title, location, and current status (New, In Progress, or Closed). A global progress counter shows how many cases have been closed and how many cryptids have been identified. The player can also navigate directly to the Cryptid Archive from the header.

**2. Select an available case**
The player clicks a case card to enter the Case Detail view for that case. All three cases are available from the start; there is no unlock gate between them. The case card animates with a page transition as the view slides into place.

**3. Read the incident report**
Inside the Case Detail view, the player reads the classified incident narrative — a dossier-style document presenting the case summary, date, location, classification level, and witness statements. The document is styled as an aged paper briefing, reinforcing the bureau aesthetic. The player cannot interact with evidence until they have opened the Case Detail view at least once (evidence slots are rendered immediately on view load).

**4. Explore and discover evidence**
Below the incident report, the player sees all evidence slots for the case. Uncollected slots are shown in a locked state — the evidence name is visible but the contents are obscured. The player clicks a locked slot to collect the item. The slot immediately transitions to a collected state with a subtle reveal animation.

**5. Examine collected evidence**
Clicking a collected evidence item opens an evidence detail panel. The panel displays the evidence name, a full description of the item, and any attached observation note the player has previously written. Players may annotate an observation note directly on the evidence card; this is stored per evidence item.

**6. Open the investigation board**
From the Case Detail view, the player clicks "Open Investigation Board." They are taken to the React Flow canvas for that case. All previously collected evidence items appear as draggable nodes, laid out in a default arrangement on first open. Nodes retain their last positions on subsequent opens.

**7. Connect related evidence and add observations**
On the investigation board, the player draws edges between evidence nodes by dragging from one node's handle to another. Each edge may carry an optional short investigator note. The player may delete edges they no longer want. The board auto-saves node positions and edges to LocalStorage as the player works.

**8. Form a cryptid hypothesis**
When the player feels they have enough evidence connected, they open the hypothesis panel. A dropdown or list shows all five cryptid names — names are always visible regardless of whether the cryptid has been discovered. The player selects one cryptid as their suspect.

**9. Submit an investigation**
The player clicks "Submit Investigation." The button is only enabled if at least two evidence items have been collected. On submission, the application runs its deterministic matching logic: it counts how many of the player's collected evidence IDs match the set associated with the selected cryptid, and calculates a confidence score. The result screen appears with an animation.

**10. View the final report and unlock the cryptid dossier**
If the identification is correct and the player clicks "File Report," the case is marked Closed and the matching cryptid's Archive entry is unlocked. The Investigation Report displays all collected evidence, the selected cryptid, and the confidence score. If the identification is incorrect, the case remains In Progress, the player sees an "Investigation Inconclusive" message, and they may return to the board to gather more evidence or select a different hypothesis.

---

## Requirements

### Section 2 — Functional Requirements

### Headquarters Dashboard (HQ)

**HQ-001**: THE Dashboard SHALL display a case card for each of the three cases, showing the case ID, title, location, classification level, and current status (New, In Progress, or Closed).

**HQ-002**: THE Dashboard SHALL display a global investigator summary showing the count of closed cases out of three and the count of identified cryptids out of five.

**HQ-003**: WHEN a player clicks a case card, THE Application SHALL navigate to the Case Detail view for that case.

**HQ-004**: THE Dashboard SHALL include a navigation link to the Cryptid Archive accessible from the bureau header.

**HQ-005**: WHEN a player has no saved progress, THE Dashboard SHALL display all three cases with a status of "New."

**HQ-006**: THE Dashboard SHALL provide a "Reset All Progress" control that, when confirmed, clears all LocalStorage data and resets all case and cryptid states to their initial values.

---

### Case Detail (CD)

**CD-001**: THE Case_Detail_View SHALL display the case classification level, case ID, case title, incident date, location, and incident narrative.

**CD-002**: THE Case_Detail_View SHALL display all witness statements associated with the case.

**CD-003**: THE Case_Detail_View SHALL render all evidence slots for the case, with locked slots showing the evidence name and collected slots showing the full evidence card.

**CD-004**: THE Case_Detail_View SHALL display the current case status (New, In Progress, or Closed) as a visible badge.

**CD-005**: WHEN a case is Closed, THE Case_Detail_View SHALL display the filed investigation report summary and prevent re-submission of the identification.

**CD-006**: THE Case_Detail_View SHALL provide a button to open the Investigation Board for that case.

---

### Evidence Discovery and Collection (EV)

**EV-001**: WHEN a player clicks a locked evidence slot, THE Evidence_Store SHALL add that evidence item to the collected set for that case. Clicking the locked slot is the only required interaction to collect it; no multi-step flow and no confirmation step are involved.

**EV-002**: WHEN an evidence item is collected, THE Case_Detail_View SHALL immediately play a Framer Motion reveal animation transitioning the slot from locked to collected state, without a page reload.

**EV-003**: WHEN a player clicks an already-collected evidence slot, THE Evidence_Store SHALL perform no state change.

**EV-004**: THE Evidence_Store SHALL persist the collected state of all evidence items to LocalStorage within 500ms of any collection event.

**EV-005**: WHEN the application loads, THE Evidence_Store SHALL restore all previously collected evidence items from LocalStorage before rendering the Case Detail view.

**EV-006**: IF LocalStorage data is corrupt or unreadable, THEN THE Evidence_Store SHALL fall back to an empty initial state without throwing a runtime error.

---

### Evidence Examination (EX)

**EX-001**: WHEN a player clicks a collected evidence card, THE Evidence_Panel SHALL open and display the evidence name, full description, and any previously saved observation note.

**EX-002**: THE Evidence_Panel SHALL provide a text input for the player to write or edit an observation note of up to 200 characters.

**EX-003**: WHEN a player edits and saves an observation note, THE Evidence_Store SHALL persist the note to LocalStorage within 500ms.

**EX-004**: WHEN the Evidence_Panel is open for a collected item, THE Application SHALL allow the player to close the panel and return to the Case Detail view without losing unsaved note text.

---

### Investigation Board (IB)

**IB-001**: THE Investigation_Board SHALL render all collected evidence items for the active case as draggable nodes on a React Flow canvas.

**IB-002**: WHEN a player opens the Investigation Board for the first time for a case, THE Investigation_Board SHALL arrange nodes in a default grid layout.

**IB-003**: WHEN a player drags a node to a new position, THE Investigation_Board SHALL persist the updated node position to LocalStorage within 500ms.

**IB-004**: THE Investigation_Board SHALL support standard React Flow canvas interactions: pan, zoom in, zoom out, and fit-to-view.

**IB-005**: WHEN a new evidence item is collected while the Investigation Board is open, THE Investigation_Board SHALL add the corresponding node to the canvas without requiring a page reload.

**IB-006**: THE Investigation_Board SHALL display a minimap for orientation on the canvas.

---

### Evidence Connections and Investigator Notes (CN)

**CN-001**: WHEN a player drags from one node's connection handle to another node's connection handle, THE Investigation_Board SHALL create an undirected edge between the two nodes.

**CN-002**: IF a player attempts to create an edge from a node to itself, THEN THE Investigation_Board SHALL reject the edge silently and create no connection.

**CN-003**: IF a player attempts to create a duplicate edge between a node pair that is already connected, THEN THE Investigation_Board SHALL reject the edge silently.

**CN-004**: WHEN an edge is created, THE Investigation_Board SHALL allow the player to add an optional text label of up to 80 characters to the edge.

**CN-005**: WHEN a player selects an edge and presses the Delete key or clicks an edge removal control, THE Investigation_Board SHALL remove that edge from the canvas and from the persisted state.

**CN-006**: THE Investigation_Board SHALL persist all edges and their labels to LocalStorage within 500ms of any edge creation or deletion event.

---

### Cryptid Identification (CI)

**CI-001**: THE Hypothesis_Panel SHALL display the names of all five cryptids as selectable options regardless of their discovered state.

**CI-002**: WHEN a player selects a cryptid suspect and clicks "Submit Investigation," THE Identification_Engine SHALL count the number of the player's collected evidence IDs that intersect with the selected cryptid's associated evidence ID set.

**CI-003**: WHEN the submitted cryptid does not match the correct answer for the active case, THE Application SHALL display an "Investigation Inconclusive" result regardless of the calculated confidence score, and THE Case_Store SHALL keep the case status as "In Progress".

**CI-004**: WHEN the player has fewer than two collected evidence items, THE Hypothesis_Panel SHALL disable the "Submit Investigation" button and display a tooltip explaining the minimum requirement.

**CI-005**: WHEN the submitted cryptid is incorrect for the case, THE Application SHALL display an "Investigation Inconclusive" result showing the confidence score and a message prompting the player to gather more evidence or select a different suspect.

**CI-006**: WHEN the result is "Investigation Inconclusive," THE Case_Store SHALL keep the case status as "In Progress" and allow the player to return to the board and submit again.

**CI-007**: WHEN the matching evidence count is below the minimum threshold for the selected cryptid, THE Application SHALL display an "Insufficient Evidence" result indicating which evidence categories are missing, without naming specific uncollected items.

**CI-008**: THE Identification_Engine SHALL support unlimited re-submission attempts with no penalty mechanic.

---

### Investigation Report (IR)

**IR-001**: WHEN a player submits a correct identification and clicks "File Report," THE Report_Store SHALL generate and persist a final Investigation Report for the case.

**IR-002**: THE Investigation_Report SHALL include: case ID, case title, filing date, the identified cryptid name, all collected evidence items with names and descriptions, and the confidence score.

**IR-003**: THE Confidence_Score SHALL be calculated as (matching evidence items ÷ total evidence items in the cryptid's associated set) × 100, rounded to the nearest integer.

**IR-004**: WHEN a report is filed, THE Report_Store SHALL persist the report to LocalStorage and mark the case as Closed.

**IR-005**: WHEN a case is Closed, THE Case_Detail_View SHALL display the filed report in read-only mode; the investigation board and hypothesis submission SHALL be locked.

---

### Cryptid Archive (CA)

**CA-001**: THE Cryptid_Archive SHALL display an entry for all five cryptids. The Pale Cartographer (cryptid-004) and The Drowned Choir (cryptid-005) are archive-only entries with no associated cases, no associated evidence IDs, and no identification threshold; their entries SHALL remain permanently locked and redacted for the duration of the MVP with no unlock path.

**CA-002**: WHEN a cryptid has not been identified, THE Cryptid_Archive SHALL display its entry as a redacted locked file showing only the cryptid's classification type and a redaction overlay.

**CA-003**: WHEN a cryptid has been correctly identified for the first time, THE Cryptid_Archive SHALL unlock that cryptid's entry and display its full dossier including name, classification, description, behaviour, and lore excerpt.

**CA-004**: THE Cryptid_Archive SHALL display a discovery counter showing how many of the five cryptids have been unlocked.

**CA-005**: WHEN a player clicks an unlocked archive entry, THE Cryptid_Archive SHALL display the full dossier detail view for that cryptid.

---

### Progress Tracking and LocalStorage Persistence (PT)

**PT-001**: WHEN the application first loads, THE Persistence_Layer SHALL read all stored state from LocalStorage and hydrate the Zustand store before rendering any interactive content.

**PT-002**: WHEN any state mutation occurs (evidence collection, board change, report filing), THE Persistence_Layer SHALL write the updated state to LocalStorage within 500ms.

**PT-003**: THE Persistence_Layer SHALL store all state under a namespaced key (e.g., `cryptid-casefiles-v1`) to avoid collisions with other LocalStorage entries.

**PT-004**: IF the LocalStorage schema version does not match the current application version, THEN THE Persistence_Layer SHALL discard the stored data and initialise a fresh state, rather than crashing or rendering corrupt data.

**PT-005**: WHEN a player confirms the "Reset All Progress" action, THE Persistence_Layer SHALL delete all namespaced keys from LocalStorage and reset the Zustand store to its initial state.

---

## Section 3 — Gameplay and Investigation Rules

### Evidence Availability

All evidence items for a case are visible as locked slots from the moment the player opens the Case Detail view. A player reveals and collects an evidence item by clicking its locked slot; the item is collected immediately on click with no confirmation step. Evidence items are permanently collected once discovered; they cannot be un-collected within a session or across sessions. The reveal animation is the primary moment of discovery; it should feel significant and atmospheric. No additional interaction steps, exploration mechanics, or unlock puzzles are introduced.

### Evidence Collection

Each evidence item can be collected at most once per case. Collecting an evidence item adds it to the case's collected set in the Zustand store and triggers a LocalStorage write. Clicking an already-collected item has no effect on the store or the persistence layer. The reveal animation is the primary moment of discovery; it should feel significant and atmospheric. No additional interaction steps, exploration mechanics, or unlock puzzles are introduced.

### Investigation Board

All collected evidence items for the active case appear as nodes on the React Flow canvas. Nodes are freely draggable; positions are persisted to LocalStorage. Players may draw undirected edges between any two distinct nodes. Self-loops (an edge from a node to itself) are rejected silently with no error message shown. Duplicate edges between the same node pair are also rejected silently. Edges may optionally carry a short text label serving as an investigator note, capped at 80 characters. Players may delete any edge by selecting it and pressing Delete or clicking an edge removal control.

### Cryptid Hypothesis and Submission

The player selects a suspected cryptid from a list of all five cryptids. Cryptid names are always visible regardless of their discovery state in the Archive. The player clicks "Submit Investigation" to trigger evaluation. Submission requires at least two collected evidence items; if fewer are collected, the button is disabled with a tooltip explaining the minimum requirement.

Identification is evaluated deterministically in two sequential steps. First, the Identification Engine checks whether the selected cryptid matches the correct answer for the active case using a hardcoded static case-to-cryptid mapping. If the selected cryptid is not the correct answer for the case, the result is immediately "Investigation Inconclusive" — no further evaluation occurs. Second, only if the selected cryptid is the correct answer for the case does the engine check whether the confidence score meets or exceeds the cryptid's minimum identification threshold. If the threshold is not met, the result is "Insufficient Evidence."

The confidence score is always calculated and displayed regardless of whether the selected cryptid is correct. A high confidence score for the wrong cryptid does not trigger any success state.

### Confidence Score

Formula: (matching evidence items ÷ total evidence items in the cryptid's associated set) × 100, rounded to the nearest integer. If the player selects a cryptid with zero associated evidence items, the confidence score is 0. The score is stored on the Investigation Report and does not change after filing.

### Wrong Identification

If the player selects a cryptid that is not the correct answer for the active case, the result is always "Investigation Inconclusive" regardless of how high the calculated confidence score is. The case status remains "In Progress." The application displays the confidence score alongside a message prompting the player to gather more evidence or try a different hypothesis. The player may re-open the investigation board, collect additional evidence, and submit again. There is no penalty mechanic and no limit on re-submissions.

### Incomplete Investigation

If the player submits with fewer than the minimum matching evidence items for the selected cryptid, the result is "Insufficient Evidence." The application shows which evidence categories are missing without naming the specific uncollected items. The case remains In Progress.

### Case Completion

A case is marked Closed only when the player submits the correct cryptid identification and clicks "File Report." Filing the report locks the case — evidence can still be viewed but the board and identification cannot be re-submitted. The cryptid's Archive entry is unlocked on first correct identification, regardless of whether the player has clicked "File Report."

---

## Section 4 — Initial Game Content

### Case 001: The Forest Watcher

**Case ID**: case-001
**Classification**: LEVEL 3 — RESTRICTED
**Location**: Harrow Pines State Forest, Dunmore County, Oregon
**Incident Date**: October 14

**Incident Description**:
Beginning on the evening of October 14, three separate parties reported seeing a tall, motionless figure standing at the tree line of Harrow Pines State Forest at dusk. The figure, described consistently as between nine and ten feet in height, was observed at a distance and appeared to vanish when approached. Forest Service personnel found no footprints in the soft soil beneath its reported positions, yet branches at a height of twelve feet had been cleanly snapped across a half-mile stretch of trail. A camera trap operated by Ranger D. Alcott captured a thermal image in the early hours of October 15 showing a bipedal heat signature of unusual height and density that does not correspond to any known local fauna.

**Witness Statements**:

*Ranger D. Alcott, Harrow Pines Forest Service Station:*
"I've patrolled this forest for eleven years and I've never seen the deer disappear like that — not before a storm, not before anything. We checked the camera trap after a hiker called in the sighting and what came back on thermal stopped me cold. It's not a bear. It's not anything I can put a name to. The shape just stands there at the edge of the frame like it's been there forever."

*K. Vasquez, recreational hiker:*
"I looked up from the trail and it was just there between the trees. It wasn't moving, wasn't making a sound. I thought it was a dead tree at first, but dead trees don't have eyes. I took one step toward it and I don't know how to explain this — I just turned around and walked away as fast as I could, like every part of my body decided at once that I needed to leave."

**Evidence Items**:

- **EV-001 — Broken Branches**: A series of limb fractures documented along a half-mile stretch of trail in Harrow Pines, all occurring at a consistent height of approximately twelve feet. No storm or high-wind event was recorded in the 72 hours prior. The breaks show compression fracture patterns inconsistent with wildlife or human activity.

- **EV-002 — Thermal Anomaly**: A thermal image retrieved from Ranger Alcott's wildlife camera trap, timestamped 02:17 on October 15. The image shows a bipedal heat signature standing at the forest boundary. The estimated height of the figure is nine feet. The thermal profile does not match any known local wildlife; the heat signature is diffuse rather than concentrated, suggesting an unusual metabolic or biological structure.

- **EV-003 — Missing Deer**: Tracking data and direct observation confirm that the entire deer population within a two-mile radius of the sighting location has vacated the area. No predator activity, disease event, or food scarcity has been identified as a cause. The vacated radius corresponds precisely to the area around the camera trap sighting location.

- **EV-004 — Resin Markings**: Field investigators documented unusual resin secretions on the bark of twelve trees in the immediate sighting area. The secretions form a repeating spiral pattern and appear fresh. Laboratory analysis confirms the resin does not match any tree species native to the Pacific Northwest. The markings appear to radiate outward from a central point approximately 40 metres into the treeline.

**Correct Cryptid**: The Warden (cryptid-001)

---

### Case 002: The Hollow Lake

**Case ID**: case-002
**Classification**: LEVEL 4 — CONFIDENTIAL
**Location**: Voss Hollow Reservoir, Blackwater Ridge, Montana
**Incident Date**: October 19

**Incident Description**:
On the morning of October 19, two local fishermen reported a sudden and severe temperature drop in the surface water of Voss Hollow Reservoir, accompanied by pulses of blue-green bioluminescence visible from the shore. Later that same day, Dr. C. Ferris of the Northern Hydrology Survey was conducting a routine sonar sweep of the reservoir when her equipment detected a large, coherently moving mass at a depth of 80 feet — far exceeding the size of any species known to inhabit the lake. A follow-up dive by a contracted survey team located a stone formation on the lake floor that does not appear on any geological or archaeological survey going back to the reservoir's construction. The formation was partially obscured by the same luminescent organic material found floating on the surface.

**Witness Statements**:

*R. Haas, local fisherman:*
"The temperature change was the first thing — the water went ice-cold in under five minutes. Then the light started. Not from above, from below. These slow pulses, blue-green, spreading out in rings. I've fished this reservoir my whole life. I've never seen anything living in it that could do that. My partner wanted to stay and watch but I pulled us out. It didn't feel like something that wanted to be watched."

*Dr. C. Ferris, Northern Hydrology Survey:*
"The sonar return was unambiguous — a single coherent mass, approximately 40 metres across, moving in a slow lateral pattern at 25 metres depth. I initially assumed instrument error, but I ran the sweep three times. The mass responds to the sonar ping; it changes direction when the pulse hits it. Whatever it is, it's aware of being observed. The stone formation I found on a secondary dive has no record in our database and the geological profile of the surrounding lakebed places it as significantly older than the reservoir itself."

**Evidence Items**:

- **EV-005 — Bioluminescent Residue**: Samples of glowing organic matter collected from the surface of Voss Hollow Reservoir. The material emits a consistent blue-green light with a pulse interval of approximately 4 seconds. Preliminary analysis indicates a complex organic compound not matching any known algae, bacteria, or bioluminescent marine organism. The light emission continues for at least 72 hours after collection.

- **EV-006 — Sonar Anomaly**: Sonar sweep data from Dr. Ferris's survey equipment showing a large, coherent moving mass at 25 metres depth. The mass has an approximate diameter of 40 metres and moves in coordinated patterns inconsistent with a school of fish or debris field. The mass changes direction in response to sonar pulses, suggesting either mechanoreceptive awareness or a distributed nervous system capable of coordinated response.

- **EV-007 — Temperature Record**: A continuous data log from the reservoir's automated monitoring buoy showing a drop of 18°F over a 4-minute window at 07:43 on October 19. No meteorological event, inflow anomaly, or mechanical malfunction accounts for the rate or magnitude of the drop. The temperature returns to baseline over approximately 90 minutes, suggesting the cause is transient rather than structural.

- **EV-008 — Submerged Structure**: Photographic and sonar documentation of a partial stone formation on the lakebed at 28 metres depth, beneath and adjacent to the moving mass's observed position. The structure consists of arranged stone columns in a configuration consistent with intentional construction. No geological process produces this pattern, and no archaeological survey of the area has ever recorded the formation. The surrounding sediment has been disturbed in a circular pattern consistent with repeated passage of a large object.

**Correct Cryptid**: The Hollow (cryptid-002)

---

### Case 003: The House Without Shadows

**Case ID**: case-003
**Classification**: LEVEL 5 — EYES ONLY
**Location**: 14 Vanthorpe Lane, Greystone Falls, Vermont
**Incident Date**: October 22

**Incident Description**:
The property at 14 Vanthorpe Lane, Greystone Falls, has been vacant for six months following the sudden relocation of its tenant. Three separate visitors — a real estate agent, the former tenant, and a documentary photographer — have independently reported that no shadows form inside the house regardless of light source direction or intensity. The photographer, M. Osei, conducted a controlled session in which she confirmed that objects placed inside the house cast no shadow, while identical objects placed on the exterior porch cast normal shadows. Her electromagnetic field meter registered maximum readings in two upstairs rooms. Thermographic imaging commissioned by the bureau reveals perfect geometric cold zones with no correspondence to the building's structural elements.

**Witness Statements**:

*Former tenant (identity withheld at subject's request):*
"The shadows were the first thing I noticed when I moved in, but I told myself it was the paint colour or the windows. But you can hold up your hand in the middle of the room with a torch shining directly at it and there's nothing on the wall. There's no shadow. I started keeping every light in the house on at night because the dark without shadows is a different kind of dark. I left in September and I'm not going back."

*M. Osei, documentary photographer:*
"I've worked in dozens of locations that people call haunted and it's always been explicable — reflective surfaces, unusual acoustics. This house is different. I set up a controlled comparison: same object, same light angle, inside and outside. Inside, no shadow. I have 200 photographs documenting this. The EMF readings in the back bedroom were off the chart, and I saw something in the mirror upstairs that I haven't been able to adequately describe to anyone. The room in the reflection was the same room, but the chair was in the wrong place."

**Evidence Items**:

- **EV-009 — Shadow Absence**: A portfolio of 200 photographs taken by M. Osei documenting the complete absence of shadows cast by physical objects inside the property. Control photographs taken outside the property on the same day show normal shadow behaviour. The phenomenon is consistent across all rooms and all light sources tested, including natural daylight, incandescent, fluorescent, and directed torchlight.

- **EV-010 — Electromagnetic Disturbance**: EMF meter readings taken during M. Osei's visit show maximum-scale readings in two specific rooms: the upstairs back bedroom and the ground-floor study. Readings elsewhere in the house are within normal range. The disturbance zones are stationary and do not correlate with known electrical wiring paths or appliances. Bureau instruments returned equivalent readings on a follow-up visit two weeks later, confirming the disturbance is persistent rather than transient.

- **EV-011 — Cold Geometry**: Thermographic imaging of the interior reveals four distinct cold zones with perfectly geometric boundaries — two rectangles and two circles — with temperature differentials of up to 12°F relative to surrounding air. The zones do not correspond to walls, windows, vents, or any structural feature of the building. The geometric precision of the boundaries is inconsistent with any known thermal phenomenon.

- **EV-012 — Mirror Reflection**: Documentation of anomalous mirror behaviour throughout the property. Multiple mirrors reflect the room with subtle but consistent differences: furniture positions are slightly altered, a door appears open when it is closed, and in one instance a window is reflected as bricked up when it is not. The discrepancies are consistent across multiple observers and multiple photographic sessions, ruling out individual perception error.

**Correct Cryptid**: The Unlit (cryptid-003)

---

### The Five Cryptids

#### Cryptid 1: The Warden

**ID**: cryptid-001
**Classification**: Arboreal Territorial Entity — Class III
**Associated Evidence**: EV-001, EV-002, EV-003, EV-004
**Minimum Identification Threshold**: 3 of 4

**Physical Description**:
The Warden presents as a bipedal humanoid figure standing between nine and ten feet in height, composed of compacted bark, living wood fibre, and a semi-transparent amber resin that binds its form and gives its surface a faint internal luminescence at night. Its body tapers into branch-like extensions at the extremities, and its face — if it can be called that — is a flat panel of compressed bark from which two eyes of burning amber regard the world with absolute stillness. Observers consistently report that The Warden does not move while watched; it is only ever seen in peripheral vision or captured on recording equipment.

**Behaviour and Habitat**:
The Warden is a territorial guardian entity associated with old-growth forest boundaries. It does not display aggressive behaviour but exerts a powerful involuntary retreat response in any animal or human that enters its territory, causing observers to flee without conscious decision. It expels all fauna from a radius around its position, creating unnaturally silent zones. It marks its territory with resin secretions applied to tree bark in spiral patterns. It is believed to be inactive during daylight hours, becoming mobile only at the boundary between dusk and full dark.

**Lore Excerpt**:
*"The forest does not need us to protect it. It already has a guardian. We just didn't know to look." — Field Researcher A. Mance, internal bureau memo, 1987, classification since upgraded to RESTRICTED.*

---

#### Cryptid 2: The Hollow

**ID**: cryptid-002
**Classification**: Deep-Water Colonial Organism — Class IV
**Associated Evidence**: EV-005, EV-006, EV-007, EV-008
**Minimum Identification Threshold**: 3 of 4

**Physical Description**:
The Hollow does not exist as a single body. It is a distributed colonial organism consisting of thousands of interconnected bioluminescent nodes, each approximately the size of a human fist, suspended in a loose three-dimensional lattice across the full depth of its host body of water. The nodes communicate through coordinated light pulses and subtle electrical signals transmitted through the surrounding water. The colony moves as a unified mass when threatened or active, creating the sonar profile of a single enormous organism. When at rest, the nodes disperse to the lake floor and become indistinguishable from sediment.

**Behaviour and Habitat**:
The Hollow is non-aggressive. It appears to be driven primarily by curiosity, approaching the surface in response to vibration and light. It communicates through rhythmic bioluminescent pulses that researchers have not yet decoded. It is profoundly disturbed by sonar, which causes the colony to compress into a tight mass and move rapidly toward depth. The sudden temperature drops associated with The Hollow's surfacing activity are a byproduct of the colony displacing cold deep water as it rises. The submerged stone structures found at its habitat locations are believed to be pre-existing features the colony has adopted as anchor points.

**Lore Excerpt**:
*"Every pulse is a word in a language older than anything with a mouth. We just don't know how to listen yet." — Dr. Y. Strand, Acoustic Biology Division, Bureau Internal Report 44-C.*

---

#### Cryptid 3: The Unlit

**ID**: cryptid-003
**Classification**: Spatial Anomaly Entity — Class V
**Associated Evidence**: EV-009, EV-010, EV-011, EV-012
**Minimum Identification Threshold**: 3 of 4

**Physical Description**:
The Unlit does not have a body in any conventional sense. It exists as an absence: a region of space in which the normal behaviour of photons is suspended, electromagnetic fields are distorted, and the geometry of occupied space is subtly but measurably altered. It cannot be photographed directly because it does not interact with light in a way that produces an image. Its presence is inferred entirely from its effects on the environment — the missing shadows, the cold geometric zones, the EMF disturbance, and the persistent discrepancy between physical space and its reflected representation in mirrors.

**Behaviour and Habitat**:
The Unlit is stationary once established in an enclosed space. It shows no response to human presence and takes no direct action. However, proximity to its core region — believed to correspond to the electromagnetic disturbance zones — causes disorientation, a mild alteration of depth perception, and in some subjects, visual hallucinations characterised by seeing the room in a subtly wrong configuration. It appears to favour enclosed domestic spaces and has been documented in three separate properties over the past forty years. Whether it migrates, replicates, or is singular is unknown.

**Lore Excerpt**:
*"It doesn't haunt the house. It is the house, now — or at least the part of it that light no longer reaches." — Senior Analyst P. Vorn, Case Debrief Transcript, October 2019.*

---

#### Cryptid 4: The Pale Cartographer

**ID**: cryptid-004
**Classification**: Nomadic Surveying Entity — Class II
**Associated Evidence**: None
**Minimum Identification Threshold**: N/A
**MVP Status**: Archive-only. Not identifiable in MVP. Entry permanently locked.

**Physical Description**:
The Pale Cartographer is a thin, featureless humanoid of indeterminate height, its surface uniformly white and textureless as blank paper. It is always observed carrying hand-drawn maps of extraordinary detail and accuracy — maps of places that do not yet look the way the maps show them. It appears at locations between one and three days before those locations undergo significant, often irreversible change: demolition, flooding, fire, abandonment. It does not cause the changes. It simply records what is coming.

**Lore Excerpt**:
*"It had already drawn the reservoir before we broke ground. Every building, every waterline. I don't know how to explain that." — Source redacted, Bureau Archive file PC-7.*

---

#### Cryptid 5: The Drowned Choir

**ID**: cryptid-005
**Classification**: Acoustic Collective Entity — Class III
**Associated Evidence**: None
**Minimum Identification Threshold**: N/A
**MVP Status**: Archive-only. Not identifiable in MVP. Entry permanently locked.

**Physical Description**:
The Drowned Choir manifests as a layering of overlapping whispered voices heard exclusively near bodies of water — rivers, lakes, flooded basements, standing rain. The voices are always just below the threshold of comprehension: listeners consistently report the sensation of almost understanding before the meaning dissolves. No visual component has ever been confirmed. The voices are not attached to a single point of origin; they seem to emanate from the water surface itself, as though the water is the medium and the message simultaneously.

**Lore Excerpt**:
*"They've been saying the same thing for as long as anyone has been listening. We just haven't learned to hear water yet." — Acoustic analyst, Bureau Division 9, identity withheld.*

---

## Section 5 — Acceptance Criteria

### Headquarters Dashboard

**AC-HQ-001**: Given a player opens the application for the first time, when the Headquarters Dashboard loads, then all three case cards are displayed with a status of "New" and the investigator summary shows 0/3 cases closed and 0/5 cryptids identified.

**AC-HQ-002**: Given a player has closed one case and identified one cryptid, when the Headquarters Dashboard loads, then the summary counter shows 1/3 cases closed and 1/5 cryptids identified.

**AC-HQ-003**: Given a player clicks a case card on the Headquarters Dashboard, when the navigation occurs, then the Case Detail view for that case is displayed.

**AC-HQ-004**: Given a player clicks "Reset All Progress" and confirms the action, when the reset completes, then all case statuses return to "New," all evidence is un-collected, and the investigator summary resets to 0/3 and 0/5.

---

### Case Detail and Evidence Collection

**AC-CD-001**: Given a player opens a Case Detail view, when the view renders, then the case classification level, incident narrative, witness statements, and all evidence slots are displayed.

**AC-CD-002**: Given a player has not collected an evidence item, when they click its locked slot, then the item is added to their collected evidence and the slot transitions to a collected state immediately.

**AC-CD-003**: Given a player has already collected an evidence item, when they click its collected slot again, then no state change occurs and the item remains in the collected set unchanged.

**AC-CD-004**: Given a case is marked Closed, when the player opens its Case Detail view, then the investigation board button is disabled and the hypothesis submission controls are not available.

---

### Evidence Examination

**AC-EX-001**: Given a player clicks a collected evidence card, when the Evidence Panel opens, then the evidence name, full description, and any previously saved observation note are displayed.

**AC-EX-002**: Given a player writes a new observation note and saves it, when they close and reopen the Evidence Panel, then the saved note is still present.

**AC-EX-003**: Given a player refreshes the browser, when the application reloads, then previously saved observation notes for all evidence items are restored from LocalStorage.

---

### Investigation Board

**AC-IB-001**: Given a player opens the Investigation Board for the first time, when the canvas renders, then all previously collected evidence items for that case appear as nodes in a default layout.

**AC-IB-002**: Given a player drags a node to a new position, when they close and reopen the Investigation Board, then the node is in the position the player moved it to.

**AC-IB-003**: Given a player draws an edge between two distinct evidence nodes, when the connection is made, then the edge is rendered on the canvas and persisted to LocalStorage.

**AC-IB-004**: Given a player attempts to draw an edge from a node to itself, when the drag completes, then no edge is created and no error message is displayed.

**AC-IB-005**: Given a player attempts to create a duplicate edge between two already-connected nodes, when the drag completes, then no additional edge is created.

**AC-IB-006**: Given a player selects an edge and presses the Delete key, when the key is pressed, then the edge is removed from the canvas and from LocalStorage.

---

### Cryptid Identification and Investigation Report

**AC-CI-001**: Given a player has collected fewer than two evidence items for a case, when they view the Hypothesis Panel, then the "Submit Investigation" button is disabled and a tooltip explains that at least two evidence items are required.

**AC-CI-002**: Given a player selects the correct cryptid for the case and submits with a confidence score that meets the minimum identification threshold, when the result is evaluated, then the identification is successful and the player is prompted to file the report.

**AC-CI-003**: Given a player submits an identification with an incorrect cryptid, when the result is displayed, then the case status remains "In Progress" and the player is prompted to try again.

**AC-CI-003a**: Given a player selects an incorrect cryptid for the case, when they submit with any number of collected evidence items, then the result is always "Investigation Inconclusive" and the case remains In Progress — regardless of the confidence score.

**AC-CI-004**: Given a player submits a correct identification and clicks "File Report," when the report is filed, then the case status changes to "Closed," the cryptid Archive entry is unlocked, and the report is displayed in read-only mode.

**AC-CI-005**: Given a player's collected evidence does not meet the minimum threshold for the selected cryptid, when they submit, then the result shows "Insufficient Evidence" and indicates the missing evidence categories without naming specific uncollected items.

**AC-CI-006**: Given a player submits an incorrect identification, when they return to the investigation board, then all previously created nodes, edges, and positions are preserved.

---

### Cryptid Archive

**AC-CA-001**: Given a player opens the Cryptid Archive, when it loads, then all five cryptid entries are shown — locked entries display only the classification type with a redaction overlay, and unlocked entries show the full dossier.

**AC-CA-002**: Given a cryptid has been correctly identified for the first time, when the player opens the Archive, then that cryptid's entry is unlocked and the discovery counter increments by one.

**AC-CA-003**: Given a player clicks an unlocked Archive entry, when it opens, then the full dossier including name, classification, description, behaviour, and lore excerpt is displayed.

---

### LocalStorage Persistence

**AC-PT-001**: Given a player refreshes the browser, when the application loads, then all previously collected evidence, board node positions, edges, observation notes, case statuses, and cryptid discovery states are restored from LocalStorage.

**AC-PT-002**: Given the LocalStorage data is corrupt or contains an unrecognised schema version, when the application loads, then a fresh initial state is used and no runtime error is thrown.

**AC-PT-003**: Given a player collects evidence, when 500ms have elapsed since collection, then the new collection state is present in LocalStorage.

---

## Section 6 — UI and Experience Requirements

### Aesthetic Direction

The application's visual identity is that of a classified paranormal research bureau. The tone is premium investigative dossier — not cartoon Halloween, not neon horror. All design decisions should read as though a real government agency produced the materials: classified stamps, case reference codes, timestamped documents, and a general atmosphere of controlled institutional gravity.

### Colour Palette

- **Background**: near-black, ranging from `#0D0D0D` to `#1A1A1A`
- **Paper / card surfaces**: aged parchment, ranging from `#F5E6C8` to `#E8D5A3`, used for document and evidence card areas
- **Primary accent**: antique gold, ranging from `#B8960C` to `#D4AF37`, used for interactive elements, headings, and highlights
- **Secondary accent**: muted forest green, ranging from `#2D4A2D` to `#3D6B3D`, used for status indicators and category tags
- **Warning / alert**: restrained blood red, ranging from `#8B1A1A` to `#A52A2A`, used for classification stamps and alert states
- **Text on dark backgrounds**: off-white (`#E8E8E0`)
- **Text on parchment surfaces**: near-black (`#1A1A1A`)

### Typography

- **Headings, case numbers, and titles**: serif or slab-serif face (e.g., Playfair Display or equivalent)
- **Body text and evidence descriptions**: clean sans-serif (e.g., Inter or equivalent)
- **Classification stamps, reference codes, and system labels**: monospaced (e.g., JetBrains Mono or equivalent)

### UI Component Styling

- Case cards on the Headquarters Dashboard are styled as physical dossier folders, including a visible classification stamp and case reference number
- Evidence items on the Case Detail view are styled as field report cards with an aged-paper or torn-edge texture treatment
- The investigation board canvas uses a dark cork-board or aged blueprint aesthetic for the background
- Navigation is styled as a bureau header with case number breadcrumbs reflecting the player's current location
- Cryptid Archive entries are styled as redacted government files, with red classification overlays on locked entries
- Page transitions use Framer Motion with a duration of 300–400ms
- Evidence reveal animations (locked-to-collected transition) are the primary discovery moment; they use a deliberate Framer Motion sequence (approximately 600–800ms) to make each item feel significant. The animation should suggest a classified document being unsealed or a field artifact being logged.
- Cryptid identification result screen uses a dedicated reveal animation sequence

### Atmospheric Details

- CSS-only scan-line or paper-grain texture overlays on document surfaces (no heavy image assets)
- Classification level badges on all case materials
- Timestamps and case reference codes on all documents and evidence cards
- Avoid: excessive glow effects, cartoon iconography, modern SaaS dashboard aesthetic, bright saturated colours

---

## Section 7 — Non-Functional Requirements

### Performance

**NF-001**: THE Application SHALL complete its initial load on a local development server in under 3 seconds on a standard developer workstation.

**NF-002**: THE Investigation_Board SHALL maintain a rendering frame rate of 60fps during node drag operations on a standard developer workstation.

### Responsiveness

**NF-003**: THE Application SHALL be fully functional on desktop viewport widths of 1280px and above.

**NF-004**: THE Application SHALL be usable on tablet viewport widths of 768px and above, with all core flows accessible.

**NF-005**: THE Application SHALL make a best-effort attempt at usability on viewport widths below 768px; full mobile optimisation is not required for the MVP.

### Accessibility

**NF-006**: THE Application SHALL provide accessible labels for all interactive elements, including buttons, links, form inputs, and canvas controls.

**NF-007**: THE Application SHALL meet WCAG 2.1 Level AA colour contrast requirements for all primary body text.

**NF-008**: THE Application SHALL support keyboard navigation for all core flows: navigating between cases, collecting evidence, opening the board, submitting an identification, and accessing the Archive.

**NF-009**: THE Application SHALL respect the `prefers-reduced-motion` media query and disable or reduce all Framer Motion animations when the preference is set.

### Code Quality

**NF-010**: THE Application SHALL be written with TypeScript strict mode enabled and SHALL produce zero type errors at build time.

### Persistence

**NF-011**: THE Persistence_Layer SHALL complete any LocalStorage write operation within 500ms of the triggering state mutation.

**NF-012**: IF LocalStorage data is corrupt or unreadable, THEN THE Application SHALL fall back to an empty initial state without producing a runtime error or blank screen.

### Offline Capability

**NF-013**: THE Application SHALL support all core gameplay flows — case browsing, evidence collection, investigation board use, identification submission, and archive access — without an active internet connection.

**NF-014**: THE Application SHALL not make any mandatory external API calls during normal gameplay.

### Build

**NF-015**: THE Application SHALL complete a production build via `vite build` without errors.

**NF-016**: THE Application SHALL produce no console errors during normal gameplay on desktop browsers.

---

## Section 8 — Scope Boundaries

The following features are explicitly out of scope for the weekend MVP and must not be implemented or partially stubbed in ways that introduce dead code or incomplete UI:

- User authentication, accounts, or player profiles
- Backend server, database, or cloud storage of any kind
- Multiplayer or collaborative investigation sessions
- Real-time features or WebSocket connections
- AI-powered evidence analysis or cryptid identification (all matching logic is deterministic and predefined in static data)
- More than three playable cases at launch
- More than five cryptids at launch
- Audio, music, or sound effects of any kind
- Exportable, printable, or shareable investigation reports
- Social features including sharing, leaderboards, or achievements
- Case editor, content management tools, or admin interface
- Native mobile application
- Offline PWA installation (a PWA manifest is acceptable if convenient but not required)
- Animated cutscenes or video content
- In-game tutorial or onboarding flow beyond clear, self-evident UI labelling — *superseded by Requirement Addendum A (user-approved scope change)*
- Pagination or filtering on the case list (only three cases exist)
- Undo/redo history for investigation board actions
- Identification logic or playable cases for The Pale Cartographer (cryptid-004) and The Drowned Choir (cryptid-005)

---

## Addendum — User-Approved Enhancements

These two enhancements were explicitly requested and approved by the user as a scope change. They are visual and UX additions only and must not alter any existing behaviour, test, or layout.

### Addendum A — First-Run Orientation Briefing

**Terms**: *Briefing* is the modal walkthrough titled "Bureau Orientation Briefing". *Onboarding Flag* is the LocalStorage entry `cryptid-casefiles-v1:onboarding`, stored separately from the persisted game state schema.

**Briefing steps (6)**:
1. Welcome to the Federal Bureau of Cryptid Investigation and the player's role as an investigator.
2. Case files at HQ: pick any case.
3. Read the incident report and witness statements, click sealed evidence to log it, and open logged evidence to add observations.
4. The investigation board: arrange evidence, drag from a pin to connect, and annotate connections.
5. Form a hypothesis: pick a suspect and submit. The verdict depends on naming the right creature AND logging enough corroborating evidence, not on score alone. Wrong guesses carry no penalty.
6. File the report to close the case and unlock the creature's archive dossier. Progress saves automatically.

- ON-001: WHEN the app loads and the Onboarding Flag is absent, THE Briefing SHALL open automatically once.
  - Given a first-time visitor, When the app loads, Then the Briefing opens on step 1 of 6.
- ON-002: THE Briefing SHALL provide Next, Back, and "Skip briefing" controls, a step indicator reading "Step n of 6", and a final-step "Begin investigation" control.
  - Given step 6 is shown, When the player activates "Begin investigation", Then the Briefing closes.
- ON-003: WHEN the player presses Escape while the Briefing is open, THE Briefing SHALL close as if skipped.
- ON-004: WHILE the Briefing is open, THE Briefing SHALL trap keyboard focus within the dialog, expose an accessible dialog name, and be fully operable by keyboard.
  - Given the Briefing closes, When focus is restored, Then focus returns to the element that was focused before it opened.
- ON-005: WHERE the player prefers reduced motion, THE Briefing SHALL skip or minimise its transitions.
- ON-006: WHEN the player completes or skips the Briefing, THE System SHALL set the Onboarding Flag.
- ON-007: IF LocalStorage is corrupt or unavailable, THEN THE System SHALL treat the Briefing as not seen, SHALL continue without error, and SHALL show the Briefing at most once per page load.
- ON-008: THE Sidebar SHALL provide a "Field Manual" control that reopens the Briefing at step 1 at any time.
- ON-009: WHEN the player activates "Reset All Progress", THE System SHALL retain the Onboarding Flag.
- ON-010: THE Briefing SHALL NOT open automatically on deep links except on the first visit, SHALL NOT alter game progress, and SHALL return the player to exactly the screen and state they were in when it closes.

### Addendum B — Image Assets with Graceful Fallback

**Terms**: *Image Slot* is a UI location that may display an image. *Fallback* is the existing CSS treatment shown when no image is displayed.

- IMG-001: THE System SHALL serve images from `public/images/` in subfolders `brand/`, `cases/`, `evidence/`, and `cryptids/`, and SHALL include `public/images/IMAGE_BRIEF.md` listing every expected file with its name, dimensions, and generation prompt.
- IMG-002: THE System SHALL define Image Slots for: the bureau emblem (sidebar brand mark, loading screen, Briefing welcome step); one field photograph per case (Case Detail incident report and report case particulars); one photo per evidence item (collected evidence card, evidence detail panel, report exhibit); and one specimen plate per playable cryptid (unlocked archive card, dossier, report determination).
- IMG-003: THE System SHALL NOT display or require an image for The Pale Cartographer (cryptid-004) or The Drowned Choir (cryptid-005).
- IMG-004: WHILE an evidence item is uncollected or a cryptid is locked or sealed, THE System SHALL NOT render an `<img>` element for that item and SHALL NOT issue a network request for its image.
  - Given an uncollected evidence item, When the page renders, Then the DOM contains no `<img>` for that item.
- IMG-005: IF an image file is missing or fails to load, THEN THE Image Slot SHALL render its Fallback with no broken-image icon and no layout shift.
- IMG-006: THE Image Slot SHALL maintain a fixed aspect ratio whether the image, the Fallback, or neither has loaded.
- IMG-007: THE System SHALL derive meaningful `alt` text from seed data for each content image, and SHALL use `alt=""` for decorative images such as the emblem shown beside the visible bureau name.
- IMG-008: THE System SHALL set `loading="lazy"` and `decoding="async"` on every image except the above-the-fold emblem, and SHALL specify explicit width and height or an aspect ratio on every image.
- IMG-009: WHEN zero, some, or all image files are present, THE System SHALL preserve all existing behaviour, tests, and layouts.
  - Given no image files exist, When the full test suite runs, Then all existing tests pass unchanged.
