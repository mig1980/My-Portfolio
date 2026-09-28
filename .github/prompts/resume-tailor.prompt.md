---
description: 'Tailor the résumé to a job description: propose headline, summary and top-3 bullet changes using only the fact register, as a diff for review. Read-only.'
argument-hint: 'Paste the job description'
agent: 'agent'
tools: ['read', 'search']
---

Job description:

${input:jobDescription:Paste the job description}

Propose changes to [resume.html](../../content/resume.html) and [resume-ats.html](../../content/resume-ats.html) that fit this role. Use only facts from [resume-facts.md](../../content/resume-facts.md) and follow the **Résumé Content Standards** in [copilot-instructions.md](../copilot-instructions.md). **Do not edit any file.**

1. List the 5–8 requirements from the job description that matter most, and which registered facts support each one. Name any requirement no registered fact supports; don't fill the gap.
2. Propose:
   - **Headline:** the title line and tagline (the title comes from `{{TITLE}}` in `resume/render.ts`, so say if the proposal needs a different title there)
   - **Summary:** a rewritten summary for each version
   - **Top-3 bullets:** the three current-role bullets to lead with, reordered or reworded
3. Output each proposal as a ```diff block per file (`-` current line, `+` proposed line), then a short note on likely fit impact (the executive version must stay 1 page, the ATS version 2 pages).
