# Implementation Plan: Cryptid Casefiles

## Overview

Cryptid Casefiles is a browser-based supernatural investigation game built entirely client-side with React, Vite, TypeScript, Tailwind CSS, Zustand, React Flow, and Framer Motion. This plan implements the full MVP across ten sequential phases — from project scaffolding through to testing and demo preparation — following the layered architecture defined in the design document.

---

## Tasks

### Phase 1 — Project Setup and Design System

- [x] 1. Scaffold the Vite + React + TypeScript project and install all dependencies
  - **Outcome**: A working `npm run dev` / `npm run build` project with all required packages installed and zero type errors on a clean run
  - **Dependencies**: None
  - **Files**: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `index.html`, `src/main.tsx`
  - **Criteria**:
    - `npm run dev` starts without error
    - `npm run build` completes without error
    - TypeScript strict mode is enabled in `tsconfig.json` (`"strict": true`)
    - All required packages present: `react`, `react-dom`, `react-router-dom`, `zustand`, `@xyflow/react`, `framer-motion`, `lucide-react`, `tailwindcss`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `fast-check`

  - [x] 1.1 Initialise Vite project with React + TypeScript template and install all dependencies
    - Run `npm create vite@latest` with `react-ts` template, then install all packages listed in design
    - Install dev dependencies: `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `fast-check`
    - _Requirements: NF-010, NF-015_

  - [x] 1.2 Configure Tailwind CSS with the approved design-system colour palette and typography
    - Extend `tailwind.config.ts` with the full colour palette: near-black backgrounds (`#0D0D0D`–`#1A1A1A`), parchment surfaces (`#F5E6C8`–`#E8D5A3`), antique gold (`#B8960C`–`#D4AF37`), muted forest green (`#2D4A2D`–`#3D6B3D`), blood red (`#8B1A1A`–`#A52A2A`), off-white (`#E8E8E0`), near-black text (`#1A1A1A`)
    - Configure font families: serif (`Playfair Display`), sans-serif (`Inter`), monospace (`JetBrains Mono`)
    - Add Google Fonts import to `index.html`
    - Create `src/utils/cn.ts` Tailwind class merging utility (using `clsx` + `tailwind-merge`)
    - _Requirements: Section 6 UI requirements_

  - [x] 1.3 Configure path aliases, Vitest, and shared utility files
    - Add `@/` path alias in `vite.config.ts` and `tsconfig.json`
    - Configure `vitest.config.ts` with `jsdom` environment and `@testing-library/jest-dom` setup
    - Create `src/utils/formatDate.ts` date formatting utility
    - _Requirements: NF-010_

---

### Phase 2 — Application Layout and Navigation

- [x] 2. Implement the application shell, routing, and page skeletons
  - **Outcome**: All five routes render skeleton pages; navigation between them works; invalid routes redirect to `/`; the bureau header with breadcrumbs is visible on all pages
  - **Dependencies**: Task 1
  - **Files**: `src/App.tsx`, `src/router.tsx`, `src/pages/*.tsx`, `src/components/ui/BureauHeader.tsx`, `src/components/ui/ErrorBoundary.tsx`
  - **Criteria**:
    - Navigating to `/` renders HQPage skeleton
    - Navigating to `/case/case-001` renders CaseDetailPage skeleton
    - Navigating to `/case/case-001/board` renders InvestigationBoardPage skeleton
    - Navigating to `/archive` renders ArchivePage skeleton
    - Navigating to an unknown path redirects to `/`

  - [x] 2.1 Define all TypeScript route types and create the React Router configuration with loaders
    - Create `src/router.tsx` with `createBrowserRouter` for all five routes: `/`, `/case/:caseId`, `/case/:caseId/board`, `/case/:caseId/report`, `/archive`, and `*` catch-all
    - Stub `caseDetailLoader`, `boardLoader`, `reportLoader` (full logic added in Phase 4/5/7)
    - _Requirements: Section 1 user journey, CD-001, IB-001_

  - [x] 2.2 Implement BureauHeader with navigation links and breadcrumb trail
    - Create `src/components/ui/BureauHeader.tsx` reading current route via `useLocation()` and `useParams()`
    - Render breadcrumbs per the design table: `BUREAU HQ`, `BUREAU HQ › CASE {id}`, etc.
    - Include navigation link to `/archive`
    - _Requirements: HQ-004_

  - [x] 2.3 Implement root Layout, ErrorBoundary, and page skeleton shells
    - Create `src/App.tsx` with `RouterProvider`
    - Create `src/pages/HQPage.tsx`, `CaseDetailPage.tsx`, `InvestigationBoardPage.tsx`, `ArchivePage.tsx`, `ReportPage.tsx` as skeleton shells returning placeholder `<div>`
    - Create root `ErrorBoundary` with bureau-themed error card and "Return to HQ" link
    - _Requirements: Section 6, NF-016_

---

### Phase 3 — Data Models and Initial Seed Content

- [x] 3. Define all TypeScript types and write all static seed data
  - **Outcome**: All domain interfaces exist with no type errors; all three cases, twelve evidence items, and five cryptids are represented as correctly typed constant arrays
  - **Dependencies**: Task 1
  - **Files**: `src/types/domain.ts`, `src/types/board.ts`, `src/types/progress.ts`, `src/types/report.ts`, `src/types/identification.ts`, `src/data/cases.ts`, `src/data/evidence.ts`, `src/data/cryptids.ts`
  - **Criteria**:
    - `tsc --noEmit` passes with zero errors on the type and data files
    - `CASES` array has exactly 3 entries; `EVIDENCE` array has exactly 12 entries; `CRYPTIDS` array has exactly 5 entries
    - All `evidenceIds` referenced in `Case` records exist in the evidence array
    - All `correctCryptidId` values in `Case` records exist in the cryptids array
    - cryptid-004 and cryptid-005 have `mvpStatus: 'archive-only'`, `minimumThreshold: null`, and empty `associatedEvidenceIds`

  - [x] 3.1 Define all TypeScript interfaces and union types
    - Create `src/types/domain.ts`: `ClassificationLevel`, `WitnessStatement`, `Case`, `EvidenceItem`, `Cryptid`
    - Create `src/types/board.ts`: `EvidenceNodeData`, `EvidenceNode`, `EvidenceConnectionData`, `EvidenceConnection`
    - Create `src/types/progress.ts`: `CaseStatus`, `CaseProgress`, `UserProgress`
    - Create `src/types/report.ts`: `ReportEvidenceEntry`, `InvestigationReport`
    - Create `src/types/identification.ts`: `IdentificationOutcome`, `IdentificationResult`
    - _Requirements: Section 2 all functional areas_

  - [x] 3.2 Write the three Case seed records with full narrative content
    - Create `src/data/cases.ts` exporting `CASES: Case[]` with full content for case-001 (The Forest Watcher), case-002 (The Hollow Lake), case-003 (The House Without Shadows), including all witness statements from Section 4
    - _Requirements: Section 4, CD-001, CD-002_

  - [x] 3.3 Write all twelve EvidenceItem seed records with full content
    - Create `src/data/evidence.ts` exporting `EVIDENCE: EvidenceItem[]` with full name, description, category, and caseId for EV-001 through EV-012 as specified in Section 4
    - _Requirements: Section 4, EV-001_

  - [x] 3.4 Write all five Cryptid seed records with full content
    - Create `src/data/cryptids.ts` exporting `CRYPTIDS: Cryptid[]` with full dossier content for cryptid-001 through cryptid-005
    - cryptid-004 and cryptid-005 must have `mvpStatus: 'archive-only'`, `minimumThreshold: null`, `associatedEvidenceIds: []`
    - _Requirements: Section 4, CA-001_

  - [x]* 3.5 Write seed data structural validation tests
    - Create `src/data/cases.test.ts` verifying referential integrity: all `evidenceIds` exist, all `correctCryptidId` values exist, counts are correct
    - Verify archive-only cryptids have `minimumThreshold: null` and empty `associatedEvidenceIds`
    - _Requirements: Section 4_

---

### Phase 4 — Case Management and Evidence Collection

- [x] 4. Implement the Zustand store, HQ dashboard, Case Detail view, and evidence collection
  - **Outcome**: Player can browse case cards at HQ, open a case, read the incident report, click locked evidence slots to collect them (with animation), and write observation notes; all state is reflected immediately in the UI
  - **Dependencies**: Tasks 2, 3
  - **Files**: `src/store/index.ts`, `src/store/slices/*.ts`, `src/pages/HQPage.tsx`, `src/pages/CaseDetailPage.tsx`, `src/components/features/hq/*`, `src/components/features/case/*`, `src/hooks/useCaseProgress.ts`, `src/hooks/useEvidenceCollection.ts`
  - **Criteria**:
    - HQ shows three case cards with correct status badges
    - Clicking a case card navigates to its Case Detail view
    - Clicking a locked evidence slot immediately updates the store and triggers the reveal animation
    - Clicking an already-collected slot causes no store change
    - Typing in the observation note input and saving persists the note (readable back from the store)

  - [x] 4.1 Implement the five Zustand store slices and compose the store
    - Create `src/store/slices/caseSlice.ts`: `caseStatuses`, `setCaseStatus`, `resetAllCases`
    - Create `src/store/slices/evidenceSlice.ts`: `collectedEvidence` (Set), `observationNotes`, `collectEvidence`, `saveObservationNote`, `resetAllEvidence`
    - Create `src/store/slices/boardSlice.ts`: `nodePositions`, `connections`, `updateNodePosition`, `addConnection`, `removeConnection`, `updateConnectionLabel`, `resetBoard`, `resetAllBoards`
    - Create `src/store/slices/archiveSlice.ts`: `unlockedCryptidIds` (Set), `unlockCryptid`, `resetArchive`
    - Create `src/store/slices/reportSlice.ts`: `reports`, `lastIdentificationResult`, `fileReport`, `setLastIdentificationResult`, `resetAllReports`
    - Create `src/store/index.ts` composing all slices into `AppStore` (persistence middleware stubbed for now)
    - _Requirements: EV-001, EV-003, EV-004, CN-001, IR-001, CA-003, PT-001_

  - [x] 4.2 Implement the HQ page with case grid and investigator summary
    - Implement `src/pages/HQPage.tsx`, `src/components/features/hq/CaseGrid.tsx`, `src/components/features/hq/CaseCard.tsx`
    - `CaseCard` shows case ID, title, location, classification, and status badge (`ClassificationBadge`, `StatusBadge` atoms)
    - `InvestigatorSummary` shows closed case count / 3 and identified cryptid count / 5
    - Implement `ProgressResetModal` (modal + "Reset All Progress" button) — calls all reset actions
    - _Requirements: HQ-001, HQ-002, HQ-003, HQ-005, HQ-006_

  - [x] 4.3 Implement the Case Detail page with incident report and witness statements
    - Implement `src/pages/CaseDetailPage.tsx` reading the `caseId` param and finding the case in seed data
    - Render `IncidentReport` (classification, title, narrative, date, location) and `WitnessStatements`
    - Render `CaseStatusBadge` and "Open Investigation Board" button
    - When case is Closed, render `FiledReportSummary` and hide board/submission controls per CD-005
    - Wire `caseDetailLoader` to validate `caseId` and redirect to `/` if invalid
    - _Requirements: CD-001, CD-002, CD-004, CD-005, CD-006_

  - [x] 4.4 Implement the evidence slot grid with locked/collected states and click-to-collect
    - Implement `EvidenceSlotGrid`, `EvidenceSlot`, `EvidenceCard` components
    - Locked slot shows evidence name, collected slot shows full evidence card
    - Click on locked slot calls `collectEvidence` in the store; click on collected slot calls nothing (EV-003)
    - Wire `useCaseProgress` and `useEvidenceCollection` custom hooks
    - _Requirements: EV-001, EV-002, EV-003, CD-003, AC-CD-002, AC-CD-003_

  - [x] 4.5 Implement the evidence detail panel with observation note input
    - Implement `EvidencePanel` overlay showing evidence name, description, and saved observation note
    - `ObservationNoteInput` provides a textarea capped at 200 characters; saving calls `saveObservationNote`
    - Panel can be closed without losing unsaved text (EX-004)
    - _Requirements: EX-001, EX-002, EX-003, EX-004, AC-EX-001, AC-EX-002_

  - [x]* 4.6 Write unit tests for evidence slice actions
    - `collectEvidence` adds ID to set; calling it again with the same ID is idempotent
    - `saveObservationNote` stores note under the correct key
    - `resetAllEvidence` clears all collected evidence and notes
    - _Requirements: EV-001, EV-003, EX-002_

---

### Phase 5 — Interactive Investigation Board

- [x] 5. Implement the React Flow investigation board with nodes, edges, and persistence
  - **Outcome**: Player can open the investigation board, see collected evidence as draggable nodes, draw connections between them, delete edges, type edge labels, and close/reopen to find all positions and edges preserved
  - **Dependencies**: Task 4
  - **Files**: `src/pages/InvestigationBoardPage.tsx`, `src/components/features/board/FlowCanvas.tsx`, `src/components/features/board/EvidenceNode.tsx`, `src/components/features/board/ConnectionEdge.tsx`, `src/components/features/board/BoardMinimap.tsx`, `src/hooks/useBoardSync.ts`
  - **Criteria**:
    - Board renders one node per collected evidence item
    - First open arranges nodes in default 2-column grid layout
    - Dragging a node and reopening the board shows the node in its new position
    - Dragging from one node handle to another creates an edge; self-loops are silently rejected; duplicate edges are silently rejected
    - Selecting an edge and pressing Delete removes it
    - Board redirects to case detail if case is Closed

  - [x] 5.1 Implement the `useBoardSync` hook and FlowCanvas with node construction
    - Create `src/hooks/useBoardSync.ts` building the `EvidenceNode[]` array from collected IDs, evidence seed data, and persisted node positions using `buildNodes` + `defaultGridPosition` from the design
    - Implement `src/components/features/board/FlowCanvas.tsx` as the React Flow wrapper; register the custom `evidence` node type
    - Handle `onNodesChange` to call `updateNodePosition` for position changes
    - _Requirements: IB-001, IB-002, IB-003, AC-IB-001, AC-IB-002_

  - [x] 5.2 Implement the custom EvidenceNode component
    - Create `src/components/features/board/EvidenceNode.tsx` rendering the evidence name, category badge, and React Flow `Handle` components (top + bottom)
    - Style as weathered field report card (parchment surface per design)
    - _Requirements: IB-001_

  - [x] 5.3 Implement edge creation with self-loop and duplicate rejection, edge deletion, and edge labels
    - Wire `onConnect` in `FlowCanvas` with guards: reject self-loops, reject duplicate pairs (both directions), then call `addConnection`
    - Implement `ConnectionEdge` custom edge component with an optional inline label input (max 80 chars) calling `updateConnectionLabel`
    - Wire `onEdgesDelete` to call `removeConnection`
    - _Requirements: CN-001, CN-002, CN-003, CN-004, CN-005, CN-006, AC-IB-003, AC-IB-004, AC-IB-005, AC-IB-006_

  - [x] 5.4 Implement the investigation board page, minimap, reactive node addition, and board guard
    - Implement `src/pages/InvestigationBoardPage.tsx` composing `FlowCanvas`, `HypothesisPanel` (stub), and `BoardMinimap`
    - Subscribe to `collectedEvidence[caseId]` so new collections appear as nodes without page reload (IB-005)
    - Wire `boardLoader` to redirect to `/case/:caseId` if case is Closed; add guard for 0 collected evidence
    - Add `FlowCanvas` error boundary with static evidence list fallback
    - _Requirements: IB-004, IB-005, IB-006, AC-IB-001_

  - [x]* 5.5 Write unit tests for FlowCanvas edge logic and board slice
    - `addConnection` adds edge; duplicate source/target pair is ignored; `removeConnection` removes by ID
    - FlowCanvas `onConnect` with self-loop does not call `addConnection`
    - FlowCanvas `onConnect` with duplicate pair does not call `addConnection`
    - _Requirements: CN-002, CN-003_

---

### Phase 6 — Cryptid Identification Engine

- [x] 6. Implement the identification engine, hypothesis panel UI, and all result states
  - **Outcome**: Player can select a cryptid, submit an investigation, and receive one of four outcome screens (success, inconclusive, insufficient-evidence, unknown-entity); cryptid is unlocked on success; case transitions to `identified` state
  - **Dependencies**: Task 5
  - **Files**: `src/services/identificationEngine.ts`, `src/services/scoreCalculator.ts`, `src/components/features/hypothesis/HypothesisPanel.tsx`, `src/components/features/hypothesis/CryptidSelector.tsx`, `src/components/features/hypothesis/IdentificationResultOverlay.tsx`
  - **Criteria**:
    - Submit with fewer than 2 evidence items → button is disabled with tooltip
    - Submit correct cryptid + threshold met → success screen appears; case moves to `identified`
    - Submit wrong cryptid → inconclusive screen; case stays `in-progress`
    - Submit correct cryptid + below threshold → insufficient-evidence screen showing missing categories
    - Confidence score is displayed on all result screens

  - [x] 6.1 Implement the `scoreCalculator` service
    - Create `src/services/scoreCalculator.ts` implementing `calculateConfidenceScore(matchingCount: number, totalAssociated: number): number`
    - Formula: `Math.round((matchingCount / totalAssociated) * 100)` with guard for `totalAssociated === 0` returning 0
    - _Requirements: IR-003, CI-002, AC-CI-002_

  - [x] 6.2 Implement the pure `identificationEngine` service
    - Create `src/services/identificationEngine.ts` implementing `runIdentification(...)` per the two-step pseudocode in the design: unknown-entity guard → confidence score → correct-answer gate → threshold gate → success
    - Implement `computeMissingCategories` helper returning distinct category labels of uncollected evidence
    - _Requirements: CI-002, CI-003, CI-007, CI-008, AC-CI-002, AC-CI-003, AC-CI-003a, AC-CI-005_

  - [x] 6.3 Implement the HypothesisPanel, CryptidSelector, and Submit button
    - Create `src/components/features/hypothesis/HypothesisPanel.tsx` with `CryptidSelector` dropdown listing all five cryptids by name regardless of unlock state
    - "Submit Investigation" button disabled when fewer than 2 evidence items collected; `Tooltip` shown explaining the minimum requirement
    - On submit: call `runIdentification`, call `setLastIdentificationResult`, call `unlockCryptid` if success, call `setCaseStatus('identified')` if success
    - _Requirements: CI-001, CI-004, CI-006, CI-008, AC-CI-001_

  - [x] 6.4 Implement the IdentificationResultOverlay with all four outcome states
    - Create `src/components/features/hypothesis/IdentificationResultOverlay.tsx` reading `lastIdentificationResult` from the store
    - Render distinct UI for each outcome: success (file report CTA), inconclusive (try again), insufficient-evidence (missing categories listed), unknown-entity (defensive fallback)
    - Display confidence score on all outcomes
    - _Requirements: CI-003, CI-005, CI-007, AC-CI-003, AC-CI-005_

  - [x]* 6.5 Write unit tests for the identification engine and score calculator
    - Correct cryptid + threshold met → `success`, confidence 75 (3/4)
    - Wrong cryptid → `inconclusive` regardless of evidence count
    - Correct cryptid + below threshold → `insufficient-evidence` with non-empty `missingCategories`
    - Unknown cryptid ID → `unknown-entity`
    - Score: 3/4 → 75, 0/4 → 0, 4/4 → 100, 0 associated → 0
    - _Requirements: CI-002, CI-003, CI-007, IR-003_

  - [x]* 6.6 Write property-based tests for identification engine and score calculator
    - **Property 1: Confidence Score Bounded** — for any matching count and total, score is always an integer in [0, 100]
    - **Property 2: Wrong Cryptid Always Inconclusive** — for any case and any submitted ID ≠ `correctCryptidId`, outcome is always `'inconclusive'`
    - _Requirements: CI-002, CI-003, IR-003_

---

### Phase 7 — Investigation Reports and Cryptid Archive

- [x] 7. Implement report filing, the Report page, and the Cryptid Archive
  - **Outcome**: After a successful identification the player can file a report; the report page renders all collected evidence, confidence score, and identified cryptid; the Archive page shows all five entries with correct locked/unlocked state; archive-only cryptids are permanently redacted
  - **Dependencies**: Task 6
  - **Files**: `src/services/reportBuilder.ts`, `src/pages/ReportPage.tsx`, `src/pages/ArchivePage.tsx`, `src/components/features/report/ReportDocument.tsx`, `src/components/features/report/ConfidenceIndicator.tsx`, `src/components/features/archive/CryptidGrid.tsx`, `src/components/features/archive/CryptidEntry.tsx`, `src/components/features/archive/DossierDetail.tsx`, `src/components/ui/RedactedOverlay.tsx`
  - **Criteria**:
    - Clicking "File Report" on the success overlay: marks case Closed, persists report, navigates to `/case/:caseId/report`
    - Report page shows case title, filing date, identified cryptid name, confidence score, and all collected evidence with names, descriptions, and observation notes
    - Archive shows all 5 entries; locked entries show classification type + redaction overlay; unlocked entries show full dossier
    - Discovery counter increments on first unlock
    - cryptid-004 and cryptid-005 are never unlockable; their entries remain redacted

  - [x] 7.1 Implement the `reportBuilder` service and File Report action
    - Create `src/services/reportBuilder.ts` implementing `buildReport(...)` per the design: snapshot of all collected evidence with observation notes, filing date as ISO string
    - Wire "File Report" click in `IdentificationResultOverlay` to call `buildReport`, `fileReport` (store), `setCaseStatus('closed')`, and `navigate` to the report route
    - Wire `reportLoader` to redirect to `/case/:caseId` if no report exists
    - _Requirements: IR-001, IR-002, IR-003, IR-004, IR-005, AC-CI-004_

  - [x] 7.2 Implement the Report page and report document component
    - Implement `src/pages/ReportPage.tsx` reading the report from the store by `caseId`
    - `ReportDocument` renders case ID, title, filing date, cryptid name, `ConfidenceIndicator`, and a list of all `collectedEvidence` entries with name, description, and observation note
    - _Requirements: IR-002, AC-CI-004_

  - [x] 7.3 Implement the Cryptid Archive page with locked/unlocked entries and discovery counter
    - Implement `src/pages/ArchivePage.tsx` and `CryptidGrid`
    - `CryptidEntry` renders locked entries (classification type + `RedactedOverlay`) vs. unlocked entries (full dossier); archive-only cryptids always render locked
    - Discovery counter: `{unlockedCryptidIds.size} / 5`
    - `DossierDetail` renders full dossier (name, classification, description, behaviour, lore excerpt) when entry is clicked
    - _Requirements: CA-001, CA-002, CA-003, CA-004, CA-005, AC-CA-001, AC-CA-002, AC-CA-003_

---

### Phase 8 — Persistence and State Management

- [x] 8. Implement full LocalStorage persistence, store hydration, and the reset flow
  - **Outcome**: All game state survives a browser refresh; corrupt or version-mismatched data falls back to fresh state; "Reset All Progress" wipes all state correctly
  - **Dependencies**: Task 7
  - **Files**: `src/services/persistenceService.ts`, `src/services/validationService.ts`, `src/store/middleware/persistenceMiddleware.ts`, `src/store/index.ts`, `src/hooks/useHydration.ts`, `src/App.tsx`
  - **Criteria**:
    - Collect evidence, refresh browser → evidence is still collected
    - Save an observation note, refresh → note is still present
    - Drag a board node, refresh → node is in the same position
    - File a report, refresh → report is visible and case is Closed
    - Manually corrupt the `cryptid-casefiles-v1` key in DevTools → app loads fresh state without error
    - Change `schemaVersion` in DevTools → app loads fresh state and removes the stale key

  - [x] 8.1 Implement the persistenceService with schema version check and fallback
    - Create `src/services/persistenceService.ts` implementing `loadPersistedState()` per the design pseudocode: `null` on missing key, `null` + console.warn on corrupt JSON, `null` + key removal on version mismatch, `null` on invalid shape
    - Implement `savePersistedState(state: PersistedState)` serialising Sets to arrays
    - Create `src/services/validationService.ts` implementing `isValidPersistedShape(data: unknown): boolean` checking required top-level keys
    - _Requirements: PT-001, PT-002, PT-003, PT-004, EV-005, EV-006, AC-PT-001, AC-PT-002_

  - [x] 8.2 Implement the persistence middleware with 500ms debounced writes
    - Create `src/store/middleware/persistenceMiddleware.ts` intercepting `setState`; after each mutation schedules a debounced write (500ms) via `persistenceService.savePersistedState`
    - All mutating actions from the design trigger persistence; `setLastIdentificationResult` does not
    - Wire middleware into `src/store/index.ts`
    - _Requirements: PT-002, EV-004, IB-003, CN-006, NF-011_

  - [x] 8.3 Wire store hydration in App.tsx and implement the `useHydration` hook
    - Call `persistenceService.loadPersistedState()` synchronously before first render in `App.tsx`; if valid, initialise store from persisted data; if null, use default empty state
    - Create `src/hooks/useHydration.ts` gating all interactive page rendering until hydration is complete
    - _Requirements: PT-001, AC-PT-001_

  - [x] 8.4 Implement the Reset All Progress modal and confirm the reset flow
    - `ProgressResetModal` (created in 4.2) confirms before calling all reset actions and `persistenceService` key deletion
    - After reset, navigate to `/` and re-initialise store to default state
    - _Requirements: HQ-006, PT-005, AC-HQ-004_

  - [x]* 8.5 Write unit tests for the persistence service
    - `null` localStorage → returns `null`
    - Valid JSON with correct schema → returns parsed state
    - Corrupt JSON → returns `null`, no thrown error
    - Schema version mismatch → returns `null`, removes key
    - Missing required fields → returns `null`
    - _Requirements: PT-004, EV-006, NF-012_

  - [x]* 8.6 Write property-based tests for persistence
    - **Property 7: LocalStorage Fallback on Corrupt Data** — for any non-valid-JSON or wrong-version string under the key, `loadPersistedState()` returns `null` without throwing
    - _Requirements: PT-004, EV-006_

---

### Phase 9 — Animations, Responsive Design and Visual Polish

- [x] 9. Apply full visual polish: Framer Motion animations, bureau dossier aesthetic, and responsive layout
  - **Outcome**: All pages match the classified paranormal bureau aesthetic; all Framer Motion animations play at correct durations; `prefers-reduced-motion` suppresses animations; layout is functional at 1280px+ and usable at 768px+
  - **Dependencies**: Task 8
  - **Files**: All page and component files; `src/App.tsx`; global CSS
  - **Criteria**:
    - Evidence reveal animation plays at ~700ms when a locked slot is collected
    - Page transitions animate at 300–400ms between routes
    - Identification result screen has a dedicated reveal animation
    - `prefers-reduced-motion` preference disables all Framer Motion animations
    - All parchment surfaces, classification stamps, monospace reference codes, and antique gold accents are applied across HQ, Case Detail, Board, Archive, and Report pages

  - [x] 9.1 Implement Framer Motion page transitions and evidence reveal animation
    - Add `AnimatePresence` + `motion.div` wrappers for route transitions (300–400ms)
    - Implement the evidence reveal animation sequence in `EvidenceSlot` (locked → collected, ~700ms deliberate sequence)
    - Wrap the entire animation setup in a `useReducedMotion()` check to disable when `prefers-reduced-motion` is set
    - _Requirements: EV-002, Section 6, NF-009_

  - [x] 9.2 Implement the identification result reveal and cryptid unlock animation
    - Add Framer Motion reveal animation to `IdentificationResultOverlay`
    - Add unlock animation sequence to `CryptidEntry` when first unlocked
    - _Requirements: Section 6_

  - [x] 9.3 Apply full bureau dossier styling across all pages and components
    - Style HQ case cards as physical dossier folders with classification stamps and case reference numbers
    - Style evidence cards with aged-paper / field report card treatment
    - Style the investigation board canvas with dark cork-board / aged blueprint background
    - Style Archive entries as redacted government files with red overlay on locked entries
    - Style Report page as a classified document printout
    - Apply CSS-only paper-grain / scan-line texture overlays on document surfaces
    - Ensure all colour tokens, typography, and classification badges are consistently applied
    - _Requirements: Section 6_

  - [x] 9.4 Verify responsive layout at 1280px, 1024px, and 768px viewports
    - Ensure all core flows are fully functional at 1280px+
    - Ensure all core flows are accessible at 768px+ (tablet)
    - Add WCAG 2.1 AA colour contrast to all primary body text
    - Ensure all interactive elements have accessible labels
    - _Requirements: NF-003, NF-004, NF-006, NF-007, NF-008_

---

### Phase 10 — Testing, Bug Fixes and Demo Preparation

- [x] 10. Complete all tests, fix end-to-end bugs, and verify the app is demo-ready
  - **Outcome**: All three cases are completable end-to-end; all unit and property tests pass; `npm run build` produces no errors or console warnings; LocalStorage round-trip verified after browser refresh
  - **Dependencies**: Tasks 1–9
  - **Files**: All test files; any bug-fix files identified during play-through
  - **Criteria**:
    - All three cases can be completed from New → Closed in a single session
    - Browser refresh preserves all game state correctly
    - `npm run build` exits with code 0 and zero type errors
    - All Vitest tests pass

  - [x] 10.1 Write component tests for EvidenceSlot, HypothesisPanel, and FlowCanvas
    - `EvidenceSlot`: locked slot renders correctly and triggers `collectEvidence` on click; collected slot does not trigger action
    - `HypothesisPanel`: disabled with < 2 evidence; enabled with 2+; all five cryptid names visible
    - `FlowCanvas` (mocked `@xyflow/react`): one node per collected item; self-loop does not call `addConnection`; Delete calls `removeConnection`
    - _Requirements: CI-001, CI-004, EV-001, EV-003_

  - [x]* 10.2 Write property-based tests for store slices
    - **Property 3: Evidence Collection Idempotent** — calling `collectEvidence` twice with the same ID leaves the set unchanged
    - **Property 4: Observation Note Round Trip** — any string up to 200 chars saved and read back is equal to the original
    - **Property 5: Self-Loop Edge Rejection** — `addConnection` with same source and target leaves edge set unchanged
    - **Property 6: Duplicate Edge Rejection** — `addConnection` for an already-connected pair (either direction) leaves edge set unchanged
    - _Requirements: EV-001, EV-003, EX-002, CN-002, CN-003_

  - [x] 10.3 End-to-end play-through and bug fixes
    - Complete Case 001 (The Forest Watcher), Case 002 (The Hollow Lake), Case 003 (The House Without Shadows) in full
    - Verify Archive unlocks correctly after each completion
    - Verify HQ summary counter updates to 3/3 and 3/5 after all cases are closed
    - Fix any defects found; re-run all tests after fixes
    - _Requirements: All acceptance criteria in Section 5_

  - [x] 10.4 Final build verification and console clean-up
    - Run `npm run build` and confirm zero type errors and zero build errors
    - Open the production build and verify zero console errors during a normal play-through
    - Verify `cryptid-casefiles-v1` key is written to LocalStorage within 500ms of first state mutation
    - _Requirements: NF-010, NF-015, NF-016, PT-003_

---

### Phase 11 — User-Approved Enhancements: Orientation Briefing & Images

- [x] 11. Add image asset system and first-run orientation briefing
  - **Outcome**: Optional images enhance the UI with graceful fallback, and new players get a skippable, replayable walkthrough; no existing behaviour changes
  - **Dependencies**: Phase 9 complete
  - **Files**: See sub-tasks
  - **Criteria**:
    - App behaves identically with zero, some, or all images present
    - Briefing appears once on first visit and is replayable
    - All existing tests pass
    - `tsc --noEmit` reports zero errors
  - _Requirements: ON-001…ON-010, IMG-001…IMG-009_

  - [x] 11.1 Implement image asset manifest, BureauImage with graceful fallback, image slots, and the image brief
    - **Dependencies**: Phase 9 complete
    - **Files**: `public/images/{brand,cases,evidence,cryptids}/.gitkeep`, `public/images/IMAGE_BRIEF.md`, `src/data/images.ts`, `src/components/ui/BureauImage.tsx`, and the components that host slots
    - **Criteria**:
      - App renders identically with no images present
      - Missing file shows the fallback with no broken-image icon
      - Locked evidence and locked or sealed cryptids render no `<img>`
      - All existing tests pass
      - Brief lists all 19 files with names, dimensions and prompts
    - _Requirements: IMG-001, IMG-002, IMG-003, IMG-004, IMG-005, IMG-006, IMG-007, IMG-008, IMG-009_

  - [x] 11.2 Implement the first-run Orientation Briefing with replay from the sidebar
    - **Dependencies**: 11.1
    - **Files**: `src/services/onboardingMemory.ts`, `src/hooks/useOnboarding.ts`, `src/data/onboarding.ts`, `src/components/features/onboarding/OrientationBriefing.tsx`, `src/pages/Layout.tsx`, `src/components/ui/Sidebar.tsx`, `src/test/setup.ts`
    - **Criteria**:
      - Shows once on first visit; skip or complete persists the flag
      - Replay works from the sidebar "Field Manual" control
      - Reset All Progress keeps the flag
      - Keyboard, focus trap, focus restore and reduced motion are compliant
      - Existing tests unaffected
    - _Requirements: ON-001, ON-002, ON-003, ON-004, ON-005, ON-006, ON-007, ON-008, ON-009, ON-010_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP pass; all core implementation tasks must be completed
- Every phase must complete before the next phase begins — the dependency ordering is strict
- Seed content (cases, evidence, cryptids) is defined once in Phase 3 and never mutated at runtime
- The identification engine is a pure function — it must receive all required data as parameters and have no side effects
- The persistence key is `cryptid-casefiles-v1`; a schema version mismatch causes a full reset with no migration
- archive-only cryptids (cryptid-004, cryptid-005) are never unlockable and must not have an identification path anywhere in the code
- All Framer Motion animation components must check `useReducedMotion()` before animating

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "3.1", "3.2", "3.3", "3.4"] },
    { "id": 2, "tasks": ["3.5", "4.1", "4.2", "4.3"] },
    { "id": 3, "tasks": ["4.4", "4.5"] },
    { "id": 4, "tasks": ["4.6", "5.1", "5.2"] },
    { "id": 5, "tasks": ["5.3", "5.4"] },
    { "id": 6, "tasks": ["5.5", "6.1", "6.2"] },
    { "id": 7, "tasks": ["6.3", "6.4"] },
    { "id": 8, "tasks": ["6.5", "6.6", "7.1"] },
    { "id": 9, "tasks": ["7.2", "7.3"] },
    { "id": 10, "tasks": ["8.1", "8.2"] },
    { "id": 11, "tasks": ["8.3", "8.4"] },
    { "id": 12, "tasks": ["8.5", "8.6"] },
    { "id": 13, "tasks": ["9.1", "9.2"] },
    { "id": 14, "tasks": ["9.3", "9.4"] },
    { "id": 15, "tasks": ["11.1"] },
    { "id": 16, "tasks": ["11.2"] },
    { "id": 17, "tasks": ["10.1"] },
    { "id": 18, "tasks": ["10.2", "10.3"] },
    { "id": 19, "tasks": ["10.4"] }
  ]
}
```
