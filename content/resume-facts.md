# Résumé fact register

The only facts `content/resume.html` and `content/resume-ats.html` may use. Never invent metrics, titles, dates or awards; if a change needs a fact that isn't here, stop and ask the owner.

This repository is public. Keep every entry at the level the owner would say in an interview, and never name the customer (always "a top-five global pharmaceutical company").

Items marked **[CONFIRM]** are published today but not yet verified by the owner. Don't expand or reword them until they are confirmed. Items marked **(shared)** come from `utils/careerFacts.ts`; change them there first. `tests/careerFacts.test.ts` fails if this file, the website, the AI assistant or either résumé disagrees.

## Identity and contact

- Name: Michael Gavrilov
- Location: New York City, NY
- Phone: +1-551-208-1538 (the owner chose to publish it)
- Email: contact@gavrilov.ai · LinkedIn: linkedin.com/in/mgavrilov · Site: gavrilov.ai
- Headline titles (filled into `{{TITLE}}` by `resume/render.ts`): "Strategic Account Director, Global Enterprise" (used) and "Strategic Account Director, Healthcare & Life Sciences"
- Tagline: "Engineer at heart. Strategic account leader by trade."

## Roles and dates

| Role | Employer | Dates (site) | Dates (résumés) |
|---|---|---|---|
| Strategic Account Director, Healthcare & Life Sciences | Microsoft | Jan 2017 – Present | 2017 – Present |
| Senior Account Executive, Enterprise Accounts | Microsoft | Apr 2011 – Jan 2017 | 2011 – 2017 |
| Account Technology Strategist, Enterprise Accounts | Microsoft | Jul 2008 – Mar 2011 | 2008 – 2011 |
| Partner Technology Strategist | Microsoft | Oct 2006 – Jul 2008 | 2006 – 2008 |
| IT Solutions Architect | Systematica Group | Jul 2005 – Oct 2006 | 2005 – 2006 |
| IT Operations Manager / Team Lead | Allied Testing | Apr 2002 – Jul 2005 | 2002 – 2005 |

- Microsoft tenure: 2006 – Present, stated as "20+ years at Microsoft"
- Current scope: executive owner of Microsoft's relationship with a top-five global pharmaceutical company, one of Microsoft's strategic Healthcare & Life Sciences accounts; C-suite relationships with the CIO, CDO and senior business leaders

## Metrics

| Metric | Wording | Definition |
|---|---|---|
| Account growth | "~5× since 2017 (~20% revenue CAGR)"; ATS: "approximately 5x … (about 20% revenue CAGR)" | Growth of the current account since 2017. **[CONFIRM: revenue \| consumption \| TCV]**. The wording says "revenue", so change it if the answer isn't revenue |
| Strategic agreements | "exceeding $500M in total contract value" | Total contract value of multi-year agreements structured and negotiated in the current role |
| Virtual team | "30+ person (matrixed) virtual team" | Specialist sales, engineering, customer success, support, services and global systems integrator partners |
| Enterprise revenue | "$20M+ average annual revenue" | Senior Account Executive, 2011 – 2017 |
| Partner revenue | "increased partner-influenced revenue by 150%" | Partner Technology Strategist, 2006 – 2008 |
| Team size | "8 systems engineers" | Allied Testing, 2002 – 2005 |
| Operational efficiency | "increased operational efficiency by 25%" | Allied Testing, from automation and process improvements |

## Awards (shared)

- Microsoft Platinum Club: 2×
- Microsoft Gold Club: 3×
- Quota attainment: 100% quota attainment in 9 fiscal years, including FY25 and FY26
- The website's "5× Microsoft Platinum & Gold Club recognition" stat is 2 + 3 awards. It is not the account-growth "5×".

## Certifications and executive education

| Item | Status |
|---|---|
| Microsoft Certified: Azure AI Fundamentals | On both résumés, not on the website. **[CONFIRM: date earned; Fundamentals certifications don't expire]** |
| AWS Certified Cloud Practitioner | Everywhere. **[CONFIRM: date earned and expiry; AWS certifications last 3 years]** |
| Challenger Insight Selling | Training, on both résumés, not on the website |
| Wharton Executive Education: Selling to the C-Suite | Everywhere |
| INSEAD Executive Education: Business Strategy and Financial Acumen; Value Negotiation | Everywhere |

**Do not list:** the lapsed Azure architect-level certification. The owner removed it from the site, the assistant and both résumés on Sept 27, 2026.

## Education (shared)

- M.S., Management of Technology, New York University Tandon School of Engineering
- M.S., Information Systems Engineering, Bauman State Technical University
- B.S., Computer Engineering, Bauman State Technical University
- The university name has no city in it; the owner removed it everywhere
- Years are not published

## Projects and community

- QuantumInvestor.net: creator of a generative-AI investment research experiment
- gavrilov.ai: creator of an open-source personal site with an AI assistant built on large language models
- Mentor, NYU Tandon Mastermind Mentorship program (ATS résumé only)
