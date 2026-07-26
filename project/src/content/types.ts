// Shared schema for versioned zone content. Game code reads this shape only —
// it never hardcodes facts, so content can be refreshed without touching the engine.
import type { Question } from '../logic/combat';

export interface ContentQuestion extends Question {
  concept: string; // short tag, e.g. "specificity" — lets us track curriculum coverage
  hardChoices?: string[]; // Echo Cycles: 3 near-miss distractors replace the base set (correct answer text unchanged)
}

export interface MentorLesson {
  concept: string;   // matches ContentQuestion.concept it sets up
  npc: string;       // mentor name shown in dialogue
  line: string;       // one teaching beat, delivered before practice
}

export interface ZoneContent {
  contentVersion: string;   // bump on any fact edit; sourced/verified date lives here
  zoneId: string;
  zoneName: string;
  discipline: string;
  bossName: string;
  misconception: string;    // the wrong belief the boss embodies
  petName?: string;         // pet-styled bosses: the beloved creature freed when the Misconception dissolves
  petGender?: 'm' | 'f';    // for pronouns in the freed-pet victory line
  sources: string[];        // doc URLs facts were verified against
  mentorLessons: MentorLesson[];
  questions: ContentQuestion[]; // shared pool: practice duels sample lightly, boss fight uses the full pool
}
