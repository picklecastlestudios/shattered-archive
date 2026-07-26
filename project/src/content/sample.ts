// Throwaway questions for the fun-gate prototype ONLY.
// Real curriculum ships as versioned JSON, fact-checked at authoring time.
import type { Question } from '../logic/combat';

export const SAMPLE: Question[] = [
  {
    prompt: 'Your prompt keeps getting generic answers. Best first fix?',
    choices: ['Ask again, louder', 'Add specifics: context, format, example', 'Switch models', 'Shorten it'],
    correct: 1,
    reteach: 'Specificity beats repetition — give context, desired format, and an example.',
  },
  {
    prompt: 'You want Claude to remember team style rules in every chat. Use…',
    choices: ['A really long first message', 'A Project with instructions', 'Copy-paste each time', 'Hope'],
    correct: 1,
    reteach: 'Projects hold persistent instructions and docs across every chat inside them.',
  },
  {
    prompt: 'A task needs your Google Drive files. What connects them to Claude?',
    choices: ['Email attachments', 'A Connector (MCP)', 'Screenshots', 'Retyping the docs'],
    correct: 1,
    reteach: 'Connectors use MCP — an open protocol linking Claude to your tools and data.',
  },
  {
    prompt: 'Claude Code reads which file at session start for project context?',
    choices: ['README.md', 'CLAUDE.md', 'notes.txt', '.env'],
    correct: 1,
    reteach: 'CLAUDE.md at the project root is Claude Code’s persistent project memory.',
  },
  {
    prompt: 'You repeat the same doc-formatting procedure weekly. Package it as…',
    choices: ['A skill', 'A bookmark', 'A very good memory', 'A sticky note'],
    correct: 0,
    reteach: 'Skills are reusable procedure folders (SKILL.md) Claude loads when relevant.',
  },
  {
    prompt: 'You want a report generated every Monday 9am without asking. Use…',
    choices: ['An alarm clock', 'A scheduled task', 'A long-running chat', 'Luck'],
    correct: 1,
    reteach: 'Scheduled tasks run prompts on a schedule — no one needs to be watching.',
  },
  {
    prompt: 'You close your laptop mid-task. Which Cowork mode keeps working?',
    choices: ['On your computer', 'In the cloud', 'Neither', 'Both'],
    correct: 1,
    reteach: 'Cloud Cowork runs in Anthropic’s sandbox — it keeps going with your laptop shut.',
  },
  {
    prompt: 'An interactive dashboard you’ll reopen weekly is best delivered as…',
    choices: ['A persisted artifact', 'A chat message', 'A screenshot', 'An email'],
    correct: 0,
    reteach: 'Artifacts persist in your gallery — reopen, update, and share them across sessions.',
  },
  {
    prompt: 'Claude fills a web form in your browser using…',
    choices: ['Claude in Chrome', 'A connector', 'The API', 'Copy-paste'],
    correct: 0,
    reteach: 'Claude in Chrome is the browsing agent — it clicks, types, and reads pages with you.',
  },
  {
    prompt: 'A huge refactor with independent parts is fastest with…',
    choices: ['One long session', 'Subagents in parallel', 'Manual editing', 'More coffee'],
    correct: 1,
    reteach: 'Claude Code spawns parallel subagents; each takes a slice, the lead merges results.',
  },
  {
    prompt: 'You want Claude to propose an approach BEFORE touching files. Use…',
    choices: ['Plan mode', 'Auto mode', 'A bigger prompt', 'Incognito'],
    correct: 0,
    reteach: 'Plan mode makes Claude present a plan for approval before it edits anything.',
  },
  {
    prompt: 'Skills vs plugins — which is true?',
    choices: ['Same thing', 'Plugins bundle skills + connectors + commands', 'Skills contain plugins', 'Plugins are paid'],
    correct: 1,
    reteach: 'A plugin is a package: skills, connectors, and commands together. A skill is one procedure.',
  },
];
