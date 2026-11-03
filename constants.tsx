/**
 * @fileoverview Application constants and static content data.
 * @description Contains all personal information, experience, skills,
 *              education, and other content displayed in the portfolio.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import React from 'react';
import type {
  JobRole,
  SkillGroup,
  EducationItem,
  Certification,
  ThoughtLeadershipItem,
  SocialLink,
  AwardItem,
  StatItem,
  CareerStage,
  OutsideWorkGroup,
} from './types';
import { Linkedin, Mail, Dumbbell, Lightbulb } from 'lucide-react';
import { getLogoUrl } from './utils/logo';
import { CAREER_FACTS } from './utils/careerFacts';

/**
 * Personal information displayed in Hero and Contact sections.
 */
export const PERSONAL_INFO = {
  name: 'Michael Gavrilov',
  tagline: 'Engineer at heart.',
  taglineHighlight: 'Strategic account leader by trade.',
  title: 'Strategic Account Director at Microsoft',
  location: 'New York City',
  intro: 'I help large companies move AI from pilots to results.',
  resumeUrl: '/CV/MGavrilovCV.pdf',
  summary:
    'I started my career building and operating technology. I became an architect, a strategist, and eventually a strategic account leader. The mindset never changed: understand the problem, challenge assumptions, bring the right people together, and make the solution work.',
  summaryEmphasis: [
    'Then: making servers work.',
    "Now: making AI work for some of the world's largest companies.",
  ],
};

/**
 * Suggested questions, shown both in the hero and in the chat welcome.
 */
export const SUGGESTED_QUESTIONS: readonly string[] = [
  'How does Michael approach complex problems?',
  'How has Michael led strategic enterprise relationships?',
  'How did Michael move from engineer to strategic account leader?',
];

/**
 * Career progression, oldest first. Each role in EXPERIENCE maps to one stage.
 */
export const CAREER_STAGES: readonly CareerStage[] = [
  { name: 'Engineer', summary: 'Building systems' },
  { name: 'Architect', summary: 'Architecting solutions' },
  { name: 'Strategist', summary: 'Shaping strategy' },
  { name: 'Strategic Account Leader', summary: 'Leading transformation' },
];

export const EXPERIENCE: JobRole[] = [
  {
    id: 'msft-sad-hls',
    title: 'Strategic Account Director | Healthcare & Life Sciences',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Feb 2017 - Present',
    stage: 'Account Leader',
    description: [
      "Executive owner of Microsoft's relationship with a top-five global pharmaceutical company in the US.",
      'Grew annual account revenue 5x since 2017 (~20% CAGR) across Azure, data, security, Microsoft 365 and Dynamics 365.',
      'Led full-cycle strategy, pricing and negotiations through closure for complex, multi-year cloud and AI deals exceeding $500M TCV.',
      'Partner directly with the CIO, CDO and CFO (with CEO-level engagement) to set multi-year cloud and AI strategy and run EBRs tied to R&D, manufacturing and commercial goals.',
      'Took Microsoft 365 Copilot (~55,000 net-new paid seats across a ~75,000-seat enterprise estate) and AI agents from pilots into governed production across GxP-regulated operations.',
      'Lead a 30+ person matrixed team across specialist sales, engineering, customer success, support and services with accountability for revenue, cloud consumption and forecast accuracy.',
      `Recognition: Two-time Platinum Club · Three-time Gold Club · 100%+ quota attainment in ${CAREER_FACTS.quotaAttainmentYears} fiscal years`,
    ],
  },
  {
    id: 'msft-sae',
    title: 'Senior Account Executive | Enterprise Accounts',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Apr 2011 - Jan 2017',
    stage: 'Account Leader',
    description: [
      'Delivered $20M+ in average annual revenue and owned executive relationships, account strategy and commercial execution for multinational enterprises in pharmaceutical, manufacturing, transportation and retail.',
      'Closed multi-year EA renewals and cloud expansions for Office 365, Azure and Dynamics, and exceeded 100% quota across multiple fiscal years.',
      'Directed sales, technical, services and partner teams around customer priorities, platform adoption and long-term account growth.',
      'Recognition: Microsoft Gold Club | 100% attainment',
    ],
  },
  {
    id: 'msft-ats',
    title: 'Account Technology Strategist | Enterprise Accounts',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Jul 2008 - Mar 2011',
    stage: 'Strategist',
    description: [
      'Advised CIOs and enterprise IT leaders across multinational retail and transportation accounts.',
      'Built multi-year technology roadmaps for infrastructure modernization, virtualization, collaboration and early cloud adoption.',
      'Drove adoption and value-realization programs that supported EA renewals and account expansion.',
      'Partnered with account executives on customer strategy to connect technical architecture with business priorities and investment decisions.',
    ],
  },
  {
    id: 'msft-pts',
    title: 'Partner Technology Strategist',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Oct 2006 - Jul 2008',
    stage: 'Strategist',
    description: [
      'Increased partner-influenced revenue by 150% through joint go-to-market strategies with systems integrators and ISV partners.',
      'Built technical relationships with partner and customer CTOs and CIOs to shape joint solutions and enterprise opportunities.',
      'Trained and enabled partner technical teams on the Microsoft platform to speed up solution readiness and customer deployments.',
    ],
  },
  {
    id: 'systematica-architect',
    title: 'IT Solutions Architect',
    company: 'Systematica Group',
    logo: getLogoUrl('systematic.ru'),
    period: 'Jul 2005 - Oct 2006',
    stage: 'Architect',
    description: [
      'Led architecture and technical strategy for complex enterprise IT solutions in pre-sales engagements.',
      'Translated customer business requirements into solution architectures across infrastructure, networking and application platforms.',
      'Partnered with sales teams to shape technical proposals in competitive enterprise opportunities.',
    ],
  },
  {
    id: 'allied-ops-manager',
    title: 'IT Operations Manager | Team Lead',
    company: 'Allied Testing',
    logo: getLogoUrl('alliedtesting.com'),
    period: 'Apr 2002 - Jul 2005',
    stage: 'Engineer',
    description: [
      'Led a team of 8 systems engineers responsible for enterprise IT operations across physical and virtual environments.',
      'Introduced automation and process improvements that increased operational efficiency by 25%.',
      'Built an accountable engineering team and tied daily IT operations to business priorities.',
    ],
  },
];

/**
 * Areas of work grouped by category.
 * Displayed in the Expertise section.
 */
export const SKILLS: SkillGroup[] = [
  {
    category: 'Technology',
    skills: [
      'Enterprise & Agentic AI',
      'Cloud, Data & Security Platforms',
      'Production AI in Regulated Environments',
      'Technology Architecture & Roadmaps',
    ],
  },
  {
    category: 'Strategy',
    skills: [
      'Strategic Accounts',
      'Multi-Year Account Strategy',
      'C-Suite & Boardroom Alignment',
      'Enterprise Cloud & AI Strategy',
    ],
  },
  {
    category: 'Leadership',
    skills: [
      'Executive Partnerships (CIO, CDO, CFO)',
      'Virtual Account Team Leadership (30+)',
      'Cross-Functional & Partner Execution',
      'Executive Business Reviews (EBRs/QBRs)',
    ],
  },
  {
    category: 'Commercial',
    skills: [
      'Complex Deal Structuring & Negotiation',
      'Multi-Year Enterprise Agreements',
      'Revenue & Forecast Management',
      'Strategic Partnerships',
    ],
  },
];

/**
 * Educational background and degrees.
 * Displayed in the Education section.
 */
export const EDUCATION: EducationItem[] = [
  {
    id: 'nyu-mot',
    degree: "Master's degree, Management of Technology",
    institution: 'New York University Tandon School of Engineering',
    type: 'Master',
    logo: getLogoUrl('nyu.edu'),
  },
  {
    id: 'bmstu-ms-ise',
    degree: "Master's degree, Information Systems Engineering",
    institution: CAREER_FACTS.university,
    type: 'Master',
    logo: getLogoUrl('bmstu.ru'),
  },
  {
    id: 'bmstu-bs-ce',
    degree: "Bachelor's degree, Computer Engineering",
    institution: CAREER_FACTS.university,
    type: 'Bachelor',
    logo: getLogoUrl('bmstu.ru'),
  },
];

/**
 * Professional certifications and credentials.
 * Displayed in the Education section.
 */
export const CERTIFICATIONS: Certification[] = [
  {
    id: 'wharton-csuite',
    name: 'Selling to the C-Suite',
    issuer: 'Wharton Executive Education',
    logo: getLogoUrl('wharton.upenn.edu'),
  },
  {
    id: 'insead-strategy',
    name: 'Business Strategy and Financial Acumen',
    issuer: 'INSEAD Executive Education',
    logo: getLogoUrl('insead.edu'),
  },
  {
    id: 'insead-negotiation',
    name: 'Value Negotiation',
    issuer: 'INSEAD Executive Education',
    logo: getLogoUrl('insead.edu'),
  },
  {
    id: 'aws-cloud-practitioner',
    name: 'AWS Certified Cloud Practitioner',
    issuer: 'Amazon Web Services',
    logo: getLogoUrl('aws.amazon.com'),
  },
  {
    id: 'azure-ai-fundamentals',
    name: 'Azure AI Fundamentals',
    issuer: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
  },
  {
    id: 'challenger-insight-selling',
    name: 'Challenger Insight Selling',
    issuer: 'Challenger',
    logo: getLogoUrl('challengerinc.com'),
  },
];

/**
 * Professional awards and recognition.
 * Displayed in the About section.
 */
export const AWARDS: AwardItem[] = [
  {
    id: 'platinum-gold-club',
    title: 'Platinum & Gold Club',
    issuer: 'Microsoft',
    awardLevel: `${CAREER_FACTS.platinumClubCount}× Platinum · ${CAREER_FACTS.goldClubCount}× Gold`,
    description: "Microsoft's highest annual field awards for account growth and quota attainment.",
    color: 'platinum',
    badges: [
      // Platinum art is a wide 1200x627 canvas; Gold is square. Zooms equalize the badge size.
      { src: '/Awards/PlatinumClub.png', alt: 'Platinum Club badge', zoom: 1.9 },
      { src: '/Awards/GoldClub.png', alt: 'Gold Club badge', zoom: 1.3 },
    ],
    link: '/Awards/Gold_Club_Award_Letter_2026.pdf',
    linkLabel: 'Platinum & Gold Club – view 2026 Gold Club award letter',
  },
  {
    id: 'attainment-100',
    title: '100% Attainment',
    issuer: 'Microsoft',
    description: `${CAREER_FACTS.quotaAttainment}.`,
    color: 'green',
    badges: [
      { src: '/Awards/100Attainmentretired_7Time.png', alt: '100% Attainment 7-time winner badge' },
      { src: '/Awards/Champion.png', alt: 'Champion Award FY23 Q4 badge' },
      { src: '/Awards/100Attainment_2025.png', alt: '100% Attainment 2025 badge' },
      { src: '/Awards/100Attainment__2026.png', alt: '100% Attainment 2026 badge' },
    ],
  },
];

/**
 * Life outside work.
 * Displayed in the About section.
 */
export const OUTSIDE_WORK_MOTTO = 'Family first. Always learning. Usually moving.';

export const OUTSIDE_WORK: OutsideWorkGroup[] = [
  {
    id: 'moving',
    icon: <Dumbbell className="w-5 h-5" />,
    items: ['Snowboarding', 'Boxing', 'Swimming', 'Horseback riding'],
  },
  {
    id: 'learning',
    icon: <Lightbulb className="w-5 h-5" />,
    items: ['Reading', 'Investing', 'Mentoring'],
  },
];

/**
 * Key statistics for animated display.
 * Displayed in the Stats section below Hero.
 */
export const STATS: StatItem[] = [
  { value: 20, suffix: '+', label: 'Years across technology and business' },
  { value: 500, prefix: '$', suffix: 'M+', label: 'in multi-year agreements' },
  {
    value: CAREER_FACTS.platinumClubCount + CAREER_FACTS.goldClubCount,
    label: 'Microsoft Platinum & Gold Club awards',
  },
];

/**
 * Thought leadership content (articles, publications, talks).
 * Displayed in the ThoughtLeadership section.
 */
export const THOUGHT_LEADERSHIP: ThoughtLeadershipItem[] = [
  {
    title: 'QuantumInvestor',
    type: 'Blog / Publication',
    link: 'https://quantuminvestor.net/docs.html',
  },
];

/**
 * Social media and contact links.
 * Displayed in the Contact section footer.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/in/mgavrilov',
    label: 'Connect on LinkedIn',
    icon: <Linkedin className="w-5 h-5" />,
  },
  {
    platform: 'Email',
    url: 'mailto:contact@gavrilov.ai',
    label: 'Send an email',
    icon: <Mail className="w-5 h-5" />,
  },
];
