---
description: 'Apply a résumé change to both versions (executive + ATS) following the content standards, rebuild, check fit, and summarize the diff.'
argument-hint: 'Describe the change, e.g. "add a bullet about the FY26 AI agent rollout"'
agent: 'agent'
---

Apply this change to both résumé versions: ${input:change:What should change?}

Follow the **Résumé Content Standards** in [copilot-instructions.md](../copilot-instructions.md) and use only facts from [resume-facts.md](../../content/resume-facts.md).

1. Check the change against the fact register first. If it needs a fact that isn't there, or touches a **[CONFIRM]** item, stop and ask before editing.
2. Edit [resume.html](../../content/resume.html) and [resume-ats.html](../../content/resume-ats.html). Adapt the wording to each version (ATS: no first person, "5x" not "5×", "approximately" not "~"). If the fact is in `utils/careerFacts.ts`, change it there first and keep the website and assistant in sync.
3. Run `npm run resume:build`, then `npm run resume:check`, then `npm run test:run`. The executive version must stay at exactly 1 page and the ATS version at exactly 2. If the fit breaks, tighten wording, never the template contract.
4. Discard the locally built PDFs (`git checkout --` if tracked, delete if new). The Resume PDF Action builds the official ones.
5. Normalize edited files to LF and check with `git diff --check`.
6. Summarize: the diff per file in plain language, the font size and page count each version landed at, and any rule you had to trade off. Don't commit or push unless asked.
