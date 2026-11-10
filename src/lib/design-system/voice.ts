/**
 * Tone of voice. Three sliders (1 to 5) become five live sample lines, plus the principles,
 * word choices and do and don't microcopy that go into the skill file.
 *
 * Sample lines show a voice. They are not facts about any product, so the skill file tells
 * the AI to write what is true for the product and borrow only the tone.
 */

import type { VoiceSettings } from "./types";

export type VoiceAxis = keyof VoiceSettings;

export const VOICE_AXES: { key: VoiceAxis; title: string; low: string; high: string; levels: string[] }[] = [
  { key: "formality", title: "Formality", low: "Formal", high: "Casual", levels: ["Formal", "Leans formal", "Balanced", "Leans casual", "Casual"] },
  { key: "energy", title: "Energy", low: "Calm", high: "Enthusiastic", levels: ["Calm", "Leans calm", "Balanced", "Leans enthusiastic", "Enthusiastic"] },
  { key: "detail", title: "Detail", low: "Concise", high: "Explanatory", levels: ["Concise", "Leans concise", "Balanced", "Leans explanatory", "Explanatory"] },
];

export const voiceLevelLabel = (axis: VoiceAxis, level: number): string => VOICE_AXES.find((a) => a.key === axis)!.levels[level - 1];

/** One-line summary, e.g. "Leans casual, leans calm, leans concise". */
export const voiceSummary = (voice: VoiceSettings): string =>
  VOICE_AXES.map((axis) => voiceLevelLabel(axis.key, voice[axis.key]).toLowerCase()).join(", ");

/** 1 to 2 is the low end, 3 the middle, 4 to 5 the high end. */
const bucket = (level: number): 0 | 1 | 2 => (level <= 2 ? 0 : level === 3 ? 1 : 2);

type Grid = string[][];

interface SampleDef {
  id: string;
  label: string;
  /** main[formality][energy] */
  main: Grid;
  /** extra[formality][detail]. An empty string means no second line. */
  extra: Grid;
}

const SAMPLE_DEFS: SampleDef[] = [
  {
    id: "button",
    label: "Button label",
    main: [
      ["Save changes", "Save changes", "Save changes now"],
      ["Save", "Save changes", "Save and continue"],
      ["Save", "Save it", "Save it!"],
    ],
    extra: [
      ["", "", "Your changes are stored in this project."],
      ["", "", "Your changes are saved to this project."],
      ["", "", "We'll keep your changes safe in this project."],
    ],
  },
  {
    id: "empty",
    label: "Empty state",
    main: [
      ["No projects yet.", "No projects have been created.", "Create your first project."],
      ["No projects yet.", "Nothing here yet.", "Start your first project."],
      ["Nothing here yet.", "No projects yet. Start one?", "Your first project starts here!"],
    ],
    extra: [
      ["", "Projects you create will appear here.", "Projects you create appear here, together with their status and recent activity."],
      ["", "Projects you create will show up here.", "Projects you create will show up here, along with their status and what changed last."],
      ["", "Projects you start will show up here.", "Projects you start show up here, with their status and what changed last, so you can pick up where you left off."],
    ],
  },
  {
    id: "error",
    label: "Error message",
    main: [
      ["Your changes could not be saved.", "We could not save your changes.", "We were unable to save your changes."],
      ["Couldn't save your changes.", "We couldn't save your changes.", "We couldn't save your changes. Let's try again."],
      ["Couldn't save that.", "That didn't save.", "Oops, that didn't save."],
    ],
    extra: [
      ["Try again.", "Check your connection and try again.", "Check your connection and try again. If the problem continues, contact support and mention the time of the error."],
      ["Try again.", "Check your connection and try again.", "Check your connection and try again. If it keeps happening, contact support and tell us when it happened."],
      ["Try again.", "Check your connection and try again.", "Check your connection and give it another go. Still stuck? Tell support when it happened."],
    ],
  },
  {
    id: "success",
    label: "Success message",
    main: [
      ["Changes saved.", "Your changes have been saved.", "Your changes have been saved successfully."],
      ["Saved.", "Changes saved.", "All saved. Nice work."],
      ["Saved.", "Saved. You're good.", "Saved! You're all set."],
    ],
    extra: [
      ["", "", "The updated version is now available to your team."],
      ["", "", "The updated version is live for your team."],
      ["", "", "Your team can see it now."],
    ],
  },
  {
    id: "pricing",
    label: "Pricing CTA",
    main: [
      ["Choose a plan", "Choose this plan", "Start your subscription"],
      ["Start free", "Start your trial", "Start your free trial"],
      ["Start free", "Start when you're ready", "Start now, it's free to try!"],
    ],
    extra: [
      ["Cancel at any time.", "You may cancel at any time, and billing stops at the end of the period.", "You may cancel at any time. Billing stops at the end of your current period, and you keep access until then."],
      ["Cancel any time.", "Cancel any time and billing stops at the end of the period.", "Cancel any time. Billing stops at the end of the current period, and you keep access until then."],
      ["You decide when to start. Cancel any time and it stops.", "You decide when to start. Cancel any time and it stops at the end of the period.", "You decide when to start. Cancel any time and it stops at the end of the period, and you keep access until then."],
    ],
  },
];

export interface VoiceSample {
  id: string;
  label: string;
  /** The line itself, such as the button label or the message. */
  main: string;
  /** The second line, such as helper text. Empty when the voice is concise. */
  extra: string;
}

export function buildVoiceSamples(voice: VoiceSettings): VoiceSample[] {
  const f = bucket(voice.formality);
  const e = bucket(voice.energy);
  const d = bucket(voice.detail);
  return SAMPLE_DEFS.map(({ id, label, main, extra }) => ({ id, label, main: main[f][e], extra: extra[f][d] }));
}

/** A sample as one string, for example "Couldn't save that. Try again." */
export const sampleText = (sample: VoiceSample): string => {
  if (!sample.extra) return sample.main;
  // A label such as "Start free" gets a full stop, so it reads as its own sentence.
  const first = /[.!?]$/.test(sample.main) ? sample.main : `${sample.main}.`;
  return `${first} ${sample.extra}`;
};

/** The principles for a voice, in the order the AI should apply them. */
export function voicePrinciples(voice: VoiceSettings): string[] {
  const f = bucket(voice.formality);
  const e = bucket(voice.energy);
  const d = bucket(voice.detail);
  return [
    [
      "Write complete, polite sentences. No slang, no contractions in headings or buttons. Address the user directly as \"you\".",
      "Plain, neutral sentences. Contractions are fine in body text, never slang. Address the user as \"you\".",
      "Write like a helpful colleague. Use contractions (you're, we'll, couldn't) and everyday words. Address the user as \"you\".",
    ][f],
    [
      "Stay even. No exclamation marks, no emoji, no hype words. Errors and successes sound equally steady.",
      "Warm but measured. At most one exclamation mark on a screen, and only for a real success.",
      "Show energy on good news. Exclamation marks are allowed for successes and first steps, never for errors, warnings or billing.",
    ][e],
    [
      "Say it in as few words as work. One short sentence for labels and messages. Every error ends with one next step.",
      "One or two sentences. Say what happened, then what to do next.",
      "Explain. Say what happened, why it matters and what to do next, in at most three short sentences.",
    ][d],
    "Name things the way the interface does. The word on the button is the word in the message.",
  ];
}

/** Words to reach for and words to avoid, for this voice. */
export function voiceWordChoices(voice: VoiceSettings): { use: string[]; avoid: string[] } {
  const f = bucket(voice.formality);
  const e = bucket(voice.energy);
  const use = [
    ["Save changes", "Continue", "Delete project", "please (once, when asking for effort)"],
    ["Save", "Continue", "Delete project", "plain verbs"],
    ["Save", "Start", "Got it", "you're, we'll, couldn't"],
  ][f];
  const avoid = [
    ["utilize", "kindly", "slang", "emoji"],
    ["utilize", "kindly", "synergy", "jargon"],
    ["utilize", "please be advised", "hereby", "kindly"],
  ][f];
  const hype = e === 0 ? ["amazing", "awesome", "exclamation marks", "emoji"] : e === 1 ? ["amazing", "supercharge", "more than one exclamation mark"] : ["exclamation marks on errors", "supercharge", "game-changing"];
  return { use, avoid: [...avoid, ...hype] };
}

export interface MicrocopyPair {
  category: string;
  doText: string;
  dontText: string;
  why: string;
}

/** The sample for a voice pushed to the opposite end, to show what this voice is not. */
function opposite(voice: VoiceSettings): VoiceSettings {
  const flip = (n: number) => (n <= 2 ? 5 : n >= 4 ? 1 : n);
  return { formality: flip(voice.formality), energy: flip(voice.energy), detail: flip(voice.detail) };
}

/** Do and don't microcopy for buttons, errors, empty states and confirmations. */
export function voiceMicrocopy(voice: VoiceSettings): MicrocopyPair[] {
  const mine = Object.fromEntries(buildVoiceSamples(voice).map((s) => [s.id, s]));
  const other = Object.fromEntries(buildVoiceSamples(opposite(voice)).map((s) => [s.id, s]));
  // The don't is the same line written in the opposite voice. If the voice is balanced, or the
  // opposite reads the same, a plain bad habit is shown instead.
  const dont = (id: string, fallback: string) => (other[id].main !== mine[id].main ? other[id].main : fallback);
  return [
    { category: "Button", doText: mine.button.main, dontText: "Submit", why: "Name the action in the user's words, not the system's." },
    { category: "Error", doText: sampleText(mine.error), dontText: dont("error", "Error 500: request failed."), why: "Say what happened and one next step. Never blame the user." },
    { category: "Empty state", doText: sampleText(mine.empty), dontText: dont("empty", "No data."), why: "Say what belongs here, so an empty screen reads as a starting point." },
    { category: "Confirmation", doText: sampleText(mine.success), dontText: dont("success", "Success!!!"), why: "Confirm what changed. Do not celebrate routine actions." },
  ];
}
