---
description: 'Review both résumés against the content standards and the fact register; list issues by severity with proposed replacement text. Read-only.'
agent: 'agent'
tools: ['read', 'search']
---

Review [resume.html](../../content/resume.html) and [resume-ats.html](../../content/resume-ats.html) against the **Résumé Content Standards** in [copilot-instructions.md](../copilot-instructions.md) and the facts in [resume-facts.md](../../content/resume-facts.md). **Do not edit any file.**

Check for:

- Facts not in the register, or that differ from it (numbers, titles, dates, awards, certifications, education)
- Facts present in one version but missing or different in the other
- Anything that names or hints at the customer beyond "a top-five global pharmaceutical company"
- **[CONFIRM]** items that have been expanded or reworded
- Bullets that aren't outcome first, or bury an existing metric after the first 8 words
- Tense: present for ongoing responsibilities, past for completed results and prior roles
- First person in the ATS version; "×", "~" or decorative glyphs in the ATS version
- Heading `letter-spacing` above 1px; ligatures not disabled in the ATS version

Output one table per severity (**High**: wrong or unsupported fact, customer named, versions disagree; **Medium**: standards violations; **Low**: wording polish). Columns: file, current text (short quote), issue, proposed replacement text. End with a one-line verdict. If a replacement could change the page fit, say so.
