import type { Case } from '@/types/domain'

export const CASES: Case[] = [
  {
    id: 'case-001',
    title: 'The Forest Watcher',
    classification: 'LEVEL 3 — RESTRICTED',
    location: 'Harrow Pines State Forest, Dunmore County, Oregon',
    incidentDate: 'October 14',
    narrative: `Beginning on the evening of October 14, three separate parties reported seeing a tall, motionless figure standing at the tree line of Harrow Pines State Forest at dusk. The figure, described consistently as between nine and ten feet in height, was observed at a distance and appeared to vanish when approached. Forest Service personnel found no footprints in the soft soil beneath its reported positions, yet branches at a height of twelve feet had been cleanly snapped across a half-mile stretch of trail. A camera trap operated by Ranger D. Alcott captured a thermal image in the early hours of October 15 showing a bipedal heat signature of unusual height and density that does not correspond to any known local fauna.`,
    witnessStatements: [
      {
        witness: 'Ranger D. Alcott, Harrow Pines Forest Service Station',
        statement: `I've patrolled this forest for eleven years and I've never seen the deer disappear like that — not before a storm, not before anything. We checked the camera trap after a hiker called in the sighting and what came back on thermal stopped me cold. It's not a bear. It's not anything I can put a name to. The shape just stands there at the edge of the frame like it's been there forever.`,
      },
      {
        witness: 'K. Vasquez, recreational hiker',
        statement: `I looked up from the trail and it was just there between the trees. It wasn't moving, wasn't making a sound. I thought it was a dead tree at first, but dead trees don't have eyes. I took one step toward it and I don't know how to explain this — I just turned around and walked away as fast as I could, like every part of my body decided at once that I needed to leave.`,
      },
    ],
    evidenceIds: ['EV-001', 'EV-002', 'EV-003', 'EV-004'],
    correctCryptidId: 'cryptid-001',
  },
  {
    id: 'case-002',
    title: 'The Hollow Lake',
    classification: 'LEVEL 4 — CONFIDENTIAL',
    location: 'Voss Hollow Reservoir, Blackwater Ridge, Montana',
    incidentDate: 'October 19',
    narrative: `On the morning of October 19, two local fishermen reported a sudden and severe temperature drop in the surface water of Voss Hollow Reservoir, accompanied by pulses of blue-green bioluminescence visible from the shore. Later that same day, Dr. C. Ferris of the Northern Hydrology Survey was conducting a routine sonar sweep of the reservoir when her equipment detected a large, coherently moving mass at a depth of 80 feet — far exceeding the size of any species known to inhabit the lake. A follow-up dive by a contracted survey team located a stone formation on the lake floor that does not appear on any geological or archaeological survey going back to the reservoir's construction. The formation was partially obscured by the same luminescent organic material found floating on the surface.`,
    witnessStatements: [
      {
        witness: 'R. Haas, local fisherman',
        statement: `The temperature change was the first thing — the water went ice-cold in under five minutes. Then the light started. Not from above, from below. These slow pulses, blue-green, spreading out in rings. I've fished this reservoir my whole life. I've never seen anything living in it that could do that. My partner wanted to stay and watch but I pulled us out. It didn't feel like something that wanted to be watched.`,
      },
      {
        witness: 'Dr. C. Ferris, Northern Hydrology Survey',
        statement: `The sonar return was unambiguous — a single coherent mass, approximately 40 metres across, moving in a slow lateral pattern at 25 metres depth. I initially assumed instrument error, but I ran the sweep three times. The mass responds to the sonar ping; it changes direction when the pulse hits it. Whatever it is, it's aware of being observed. The stone formation I found on a secondary dive has no record in our database and the geological profile of the surrounding lakebed places it as significantly older than the reservoir itself.`,
      },
    ],
    evidenceIds: ['EV-005', 'EV-006', 'EV-007', 'EV-008'],
    correctCryptidId: 'cryptid-002',
  },
  {
    id: 'case-003',
    title: 'The House Without Shadows',
    classification: 'LEVEL 5 — EYES ONLY',
    location: '14 Vanthorpe Lane, Greystone Falls, Vermont',
    incidentDate: 'October 22',
    narrative: `The property at 14 Vanthorpe Lane, Greystone Falls, has been vacant for six months following the sudden relocation of its tenant. Three separate visitors — a real estate agent, the former tenant, and a documentary photographer — have independently reported that no shadows form inside the house regardless of light source direction or intensity. The photographer, M. Osei, conducted a controlled session in which she confirmed that objects placed inside the house cast no shadow, while identical objects placed on the exterior porch cast normal shadows. Her electromagnetic field meter registered maximum readings in two upstairs rooms. Thermographic imaging commissioned by the bureau reveals perfect geometric cold zones with no correspondence to the building's structural elements.`,
    witnessStatements: [
      {
        witness: 'Former tenant (identity withheld at subject\'s request)',
        statement: `The shadows were the first thing I noticed when I moved in, but I told myself it was the paint colour or the windows. But you can hold up your hand in the middle of the room with a torch shining directly at it and there's nothing on the wall. There's no shadow. I started keeping every light in the house on at night because the dark without shadows is a different kind of dark. I left in September and I'm not going back.`,
      },
      {
        witness: 'M. Osei, documentary photographer',
        statement: `I've worked in dozens of locations that people call haunted and it's always been explicable — reflective surfaces, unusual acoustics. This house is different. I set up a controlled comparison: same object, same light angle, inside and outside. Inside, no shadow. I have 200 photographs documenting this. The EMF readings in the back bedroom were off the chart, and I saw something in the mirror upstairs that I haven't been able to adequately describe to anyone. The room in the reflection was the same room, but the chair was in the wrong place.`,
      },
    ],
    evidenceIds: ['EV-009', 'EV-010', 'EV-011', 'EV-012'],
    correctCryptidId: 'cryptid-003',
  },
]
