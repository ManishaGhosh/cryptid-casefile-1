# Cryptid Casefiles

A Kiroween hackathon entry for the **Costume Contest** category. Cryptid Casefiles is a classified paranormal investigation game: you work inside a government bureau, collect field evidence, connect clues on a cork-style investigation board, and identify the creature behind each case. Everything runs in the browser. There is no backend, no account and no paid API.

## Run locally

Requires Node 18+.

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check and produce a production build in dist/
npm run preview    # serve the production build
npm test           # run the full test suite once
```

Windows note: if PowerShell blocks npm scripts, use `cmd`, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## How to play

- Read the Orientation Briefing on your first visit. Replay it any time from **Field Manual** in the sidebar.
- Open a case from HQ and read the incident report and witness statements.
- Collect evidence from the evidence slots and log your own observations.
- On the Investigation Board, drag evidence and connect related items. Choose the cryptid you suspect and submit your hypothesis.
- A correct, well-supported identification lets you file a report and unlocks that cryptid in the Archive.

## Spoiler-free note

Answers are deterministic. Every case, clue and cryptid is defined in static seed data (`src/data/`), and identification is a pure function. A high confidence score for the wrong cryptid is always inconclusive.

<details>
<summary>Spoilers: solutions</summary>

| Case | Correct cryptid | Corroborating evidence | Evidence needed |
| --- | --- | --- | --- |
| 001 The Forest Watcher | The Warden | EV-001, EV-002, EV-003, EV-004 | 3 |
| 002 The Hollow Lake | The Hollow | EV-005, EV-006, EV-007, EV-008 | 3 |
| 003 The House Without Shadows | The Unlit | EV-009, EV-010, EV-011, EV-012 | 3 |

The Pale Cartographer and The Drowned Choir are archive-only. They stay sealed in this release.

</details>

## 2-minute demo script

1. Open the app and step through the Orientation Briefing.
2. From HQ, open Case 001: The Forest Watcher.
3. Collect three pieces of evidence and add an observation note.
4. Open the Investigation Board and connect the evidence items.
5. Submit a wrong guess (for example The Hollow) and see the inconclusive result.
6. Submit The Warden and watch the identification reveal.
7. File the report and read the generated document.
8. Open the Archive and see The Warden unsealed while the other entries stay redacted.
9. Refresh the page. Your progress is still there.

## Images

The app works with zero images. Optional artwork slots are described in [`public/images/IMAGE_BRIEF.md`](public/images/IMAGE_BRIEF.md).

## Tech stack and architecture

- React 18, Vite, TypeScript (strict), Tailwind CSS, React Router v6.
- Layers: typed seed data (`src/data`) feeds pure services (`src/services`: identification, scoring, report building, persistence), which feed a Zustand store with a persistence middleware, which feeds the React UI.
- The identification engine is a pure function with no store or React imports.
- The investigation board uses `@xyflow/react` and is loaded as its own lazy route chunk.
- Framer Motion handles transitions and reveals, and respects `prefers-reduced-motion`.
- State persists to LocalStorage under `cryptid-casefiles-v1`. A schema mismatch or corrupt data resets cleanly to defaults.

## Testing

Run with `npm test`. The latest run: 50 test files, 390 tests, all passing. Property-based tests use [fast-check](https://github.com/dubzzz/fast-check) for identification, persistence and store invariants. Vitest and Testing Library cover components, routing, accessibility structure and full end-to-end playthroughs of all three cases.

## Accessibility and responsiveness

- Colour contrast is checked against WCAG 2.1 AA in automated tests.
- All core flows work from the keyboard. Dialogs trap focus and controls carry accessible labels.
- Animations are skipped or reduced when reduced motion is preferred.
- Fully functional at 1280px and above, supported at 768px and above, best effort below that.

Automated checks do not replace manual testing with assistive technologies.

## Resetting

Use **Reset All Progress** on HQ. To see the briefing again, use Field Manual, or clear the `cryptid-casefiles-v1:onboarding` key in LocalStorage.
