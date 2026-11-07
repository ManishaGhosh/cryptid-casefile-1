# Cryptid Casefiles — Project Steering Guidelines

These rules apply to all implementation work on this project. Follow them across every task, every file, and every decision throughout development.

---

## Product Principles

**1. Premium paranormal investigation experience first.**
Every screen, interaction, and piece of copy should reinforce the feeling of working inside a real classified government bureau. If something looks or feels like a generic web app, revisit it.

**2. Functionality over decoration.**
A working investigation loop with minimal styling is better than a beautiful app that is broken. Complete core mechanics before adding atmospheric polish.

**3. Every screen earns its place.**
There are no filler screens. HQ, Case Detail, Investigation Board, Archive, and Report all serve a specific purpose in the investigation loop. Do not add screens outside the approved five.

---

## Coding Principles

**TypeScript strict mode — no exceptions.**
`strict: true` is set in `tsconfig.json`. Zero type errors at all times. Run `tsc --noEmit` before considering any task complete.

**No ny.**
Use unknown with a type guard, a proper union, or a specific interface instead. If you find yourself reaching for ny, the type model needs to be improved.

**Reusable components.**
Build `ClassificationBadge`, `StatusBadge`, `RedactedOverlay`, `Tooltip`, and `BureauHeader` once and use them everywhere they are needed. Do not duplicate UI logic across pages.

**Business logic belongs in services, not components.**
- Identification logic lives in `src/services/identificationEngine.ts`.
- Score calculation lives in `src/services/scoreCalculator.ts`.
- Report assembly lives in `src/services/reportBuilder.ts`.
- Persistence lives in `src/services/persistenceService.ts`.
- React components call these services; they do not reimplement them.

**Centralized typed seed data.**
All game content (cases, evidence, cryptids) lives in `src/data/`. These files are the single source of truth. No case-specific strings, IDs, or logic are hardcoded into components.

**Predictable state management.**
- One Zustand store composed of five slices: caseSlice, evidenceSlice, oardSlice, rchiveSlice, 
eportSlice.
- Every action has a single, clearly named responsibility.
- `lastIdentificationResult` is ephemeral UI state — it is not persisted to LocalStorage.
- Derived values (closed case count, identified cryptid count) are computed from store state, not stored separately.

**Handle all UI states explicitly.**
Every data-dependent component must handle: loading/hydrating, empty/no-data, error, and the normal populated state. No component should render incorrectly while the store is being hydrated from LocalStorage.

**Avoid unnecessary dependencies.**
The approved stack is: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Zustand, Framer Motion, @xyflow/react, Lucide React, Vitest, @testing-library/react, fast-check. Do not add packages outside this list without a clear justification.

---

## Design Principles

**Dark classified research bureau aesthetic.**
- Backgrounds: near-black (#0D0D0D to #1A1A1A).
- Document and card surfaces: aged parchment (#F5E6C8 to #E8D5A3).
- Primary accent: antique gold (#B8960C to #D4AF37) for interactive elements and headings.
- Secondary accent: muted forest green (#2D4A2D to #3D6B3D) for status indicators and tags.
- Alert/warning: restrained blood red (#8B1A1A to #A52A2A) for classification stamps and alerts.
- Text on dark: off-white (#E8E8E0). Text on parchment: near-black (#1A1A1A).

**No generic SaaS dashboard styling.**
Case cards are dossier folders, not analytics tiles. Evidence items are field report cards, not list items. The investigation board is a cork-board, not a workflow diagram. If it looks like it belongs in a project management tool, restyle it.

**Consistent spacing, typography, and colour.**
- Headings and case numbers: serif or slab-serif (Playfair Display).
- Body and evidence text: clean sans-serif (Inter).
- Classification stamps, reference codes, system labels: monospaced (JetBrains Mono).
Use Tailwind design tokens defined in `tailwind.config.ts` for all colour and spacing values. Do not use arbitrary hex values inline.

**Subtle animations, not excessive effects.**
- Page transitions: 300–400ms Framer Motion fade/slide.
- Evidence reveal: ~700ms deliberate sequence evoking a document being unsealed.
- Identification result: a purposeful reveal, not a flashy celebration.
- `useReducedMotion()` must be checked before every Framer Motion animation. If reduced motion is preferred, skip or minimise the animation.
- No looping animations, no excessive glow, no particle effects.

**Readable text and accessible interactions.**
- WCAG 2.1 Level AA colour contrast on all primary body text.
- All buttons, links, inputs, and canvas controls must have accessible labels (ria-label or visible text).
- Keyboard navigation must work for all core flows.

**Responsive layout.**
- Fully functional at 1280px and above.
- Usable at 768px and above (tablet).
- Best-effort at below 768px — not required to be perfect, but must not break.

---

## Scope Protection

**No authentication or backend.**
This is a fully client-side application. There are no user accounts, no API calls for game data, no server. All state lives in LocalStorage under the key `cryptid-casefiles-v1`.

**No paid API dependencies.**
All identification logic is deterministic and defined in static seed data. Do not introduce OpenAI, any LLM API, or any paid third-party service.

**No features outside the approved MVP.**
The five approved pages, three cases, twelve evidence items, five cryptids, and the investigation loop are the complete product. If a new feature idea comes up during implementation, note it and ask before building it.

**Finish before extending.**
If a core feature is incomplete, fix it before starting a new one. A fully working investigation loop with basic styling ships; a half-built feature with beautiful animations does not.

---

## Persistence Rules

- Storage key: `cryptid-casefiles-v1`.
- Schema version is stored in the persisted object. Any mismatch triggers a full reset (discard stored data, reinitialise to defaults). There is no migration path.
- All state writes happen within 500ms of a store mutation via the persistence middleware.
- `loadPersistedState()` is called synchronously before the first render in App.tsx.
- Corrupt JSON, missing keys, and wrong schema version all fall back to an empty initial state without throwing a runtime error.

---

## Archive-Only Cryptids

The Pale Cartographer (cryptid-004) and The Drowned Choir (cryptid-005) are **permanently locked** in the MVP. They have mvpStatus: 'archive-only', minimumThreshold: null, and ssociatedEvidenceIds: []. No code path should ever call `unlockCryptid` with their IDs. Their Archive entries always render with the redacted overlay.

---

## Identification Engine Contract

The identification engine is a **pure function** — it takes inputs and returns an `IdentificationResult`. It has no side effects and no imports from the store or React. The two-step evaluation is:

1. If the submitted cryptid ID is not the `correctCryptidId` for the active case → outcome is `'inconclusive'`.
2. If the submitted cryptid ID matches but the confidence score is below `minimumThreshold` → outcome is `'insufficient-evidence'`.
3. If both checks pass → outcome is `'success'`.

A high confidence score for the **wrong** cryptid is always 'inconclusive'. This rule must never be violated.
