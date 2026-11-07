/** Content for the first-run Orientation Briefing (Requirement Addendum A). */
export type BriefingVisual = 'emblem' | 'case-files' | 'evidence' | 'board' | 'hypothesis' | 'report'

export interface BriefingStep {
  id: string
  eyebrow: string
  title: string
  body: string[]
  tip?: string
  visual: BriefingVisual
}

export const BRIEFING_STEPS: readonly BriefingStep[] = [
  {
    id: 'welcome',
    eyebrow: 'Welcome, investigator',
    title: 'Federal Bureau of Cryptid Investigation',
    body: [
      'You have been assigned to the Bureau. Reports of unexplained creatures land on your desk, and it is your job to work out what is really out there.',
      'This briefing takes about a minute. Skip it whenever you like; the Field Manual in the sidebar brings it back.',
    ],
    visual: 'emblem',
  },
  {
    id: 'case-files',
    eyebrow: 'Step one',
    title: 'Pick a case file',
    body: [
      'Bureau HQ lists every open case as a dossier. Choose any case to begin. You can work them in any order.',
      'Each file shows its status, so you can see which cases are new, in progress or closed.',
    ],
    visual: 'case-files',
  },
  {
    id: 'evidence',
    eyebrow: 'Step two',
    title: 'Gather the evidence',
    body: [
      'Read the incident report and the witness statements first. Then click a sealed evidence slot to log it to your file.',
      'Open any logged item to examine it and add your own observations.',
    ],
    tip: 'Sealed evidence stays classified until you log it.',
    visual: 'evidence',
  },
  {
    id: 'board',
    eyebrow: 'Step three',
    title: 'Work the investigation board',
    body: [
      'Open the board to arrange your logged evidence as cards. Drag from a pin on one card to another to connect them.',
      'Add a note to a connection to record why the two items belong together.',
    ],
    visual: 'board',
  },
  {
    id: 'hypothesis',
    eyebrow: 'Step four',
    title: 'Name the creature',
    body: [
      'Choose a suspect and submit your hypothesis. The verdict depends on naming the right creature and logging enough corroborating evidence. A high score alone is not enough.',
      'Wrong guesses carry no penalty, so you can gather more evidence and try again.',
    ],
    visual: 'hypothesis',
  },
  {
    id: 'report',
    eyebrow: 'Step five',
    title: 'File your report',
    body: [
      'Once your identification is confirmed, file the report. Filing closes the case and unlocks the creature\u2019s dossier in the Cryptid Archive.',
      'Progress saves automatically on this device. The Field Manual in the sidebar replays this briefing at any time.',
    ],
    visual: 'report',
  },
]
