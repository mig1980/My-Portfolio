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

/**
 * Personal information displayed in Hero and Contact sections.
 */
export const PERSONAL_INFO = {
  name: 'Michael Gavrilov',
  tagline: 'Engineer at heart.',
  taglineHighlight: 'Strategic account leader by experience.',
  title: 'Strategic Account Director at Microsoft',
  location: 'New York City',
  focus: 'Technology · AI · Strategy',
  intro: 'I turn ambitious AI ideas into business reality.',
  resumeUrl: '/CV/Michael-Gavrilov-Resume.pdf',
  summary:
    'I started my career building and operating technology. I became an architect, strategist, and eventually a strategic account leader. The mindset never changed: understand the problem, challenge assumptions, bring the right people together, and make the solution work.',
  summaryEmphasis: 'Today, the systems are just bigger.',
};

/**
 * Suggested questions, shown both in the hero and in the chat welcome.
 */
export const SUGGESTED_QUESTIONS: readonly string[] = [
  'How does Michael approach complex problems?',
  'How has Michael led strategic enterprise relationships?',
  'How did Michael move from engineer to strategic account leader?',
];

export const HERO_QUESTIONS: readonly string[] = SUGGESTED_QUESTIONS;

export const CHAT_WELCOME_QUESTIONS: readonly string[] = SUGGESTED_QUESTIONS;

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
    period: 'Jan 2017 - Present',
    stage: 'Account Leader',
    description: [
      'Lead the AI and technology agenda for a strategic global pharmaceutical customer, aligning Microsoft capabilities with business priorities and measurable outcomes.',
      'Develop and execute multi-year account strategies spanning AI, cloud, data, security, modern work, and business applications.',
      'Orchestrate a large cross-functional virtual team across sales, engineering, customer success, support, services, and partner organizations.',
      'Build trusted relationships with senior business and technology executives, establishing governance and alignment around long-term transformation priorities.',
      'Navigate complex global stakeholder environments and turn technical, organizational, and commercial challenges into actionable strategies.',
      'Structure strategic partnerships and multi-year agreements exceeding $500M.',
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
      'Managed robust sales pipelines and guided high-performing teams across Sales, Engineering, and Delivery.',
      'Consistently exceeded revenue targets, generating an average of $20M annually across Pharma, Transportation, and Manufacturing sectors.',
      'Developed trusted relationships with executive stakeholders across multiple industries.',
    ],
  },
  {
    id: 'msft-ats',
    title: 'Account Technology Strategist | Enterprise Accounts',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'July 2008 - Mar 2011',
    stage: 'Strategist',
    description: [
      'Advised senior executives on technology transformation strategies aligning with business goals.',
      'Drove adoption strategies, ensuring sustained momentum and value realization.',
      'Executed tailored sales strategies, consistently exceeding targets and securing contract renewals.',
    ],
  },
  {
    id: 'msft-pts',
    title: 'Partner Technology Strategist',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Oct 2006 - July 2008',
    stage: 'Strategist',
    description: [
      'Structured platform partnerships and joint go-to-market strategies driving partner growth and revenue.',
      'Led programs resulting in a 150% increase in partner-influenced revenue.',
      'Cultivated technical relationships with CTOs/CIOs to understand their business challenges.',
    ],
  },
  {
    id: 'systematica-architect',
    title: 'IT Solutions Architect',
    company: 'Systematica Group',
    logo: getLogoUrl('systematic.ru'),
    period: 'July 2005 - Oct 2006',
    stage: 'Architect',
    description: [
      'Led architectural design and technical strategy for complex IT solutions in pre-sales engagements.',
      'Collaborated with sales teams and enterprise clients to align technology with business objectives.',
    ],
  },
  {
    id: 'allied-ops-manager',
    title: 'IT Operations Manager | Team Lead',
    company: 'Allied Testing',
    logo: getLogoUrl('alliedtesting.com'),
    period: 'Apr 2002 - July 2005',
    stage: 'Engineer',
    description: [
      'Led a team of systems engineers to deliver process improvements and automation, increasing operational efficiency by 25%.',
      'Managed IT services and operations for virtual and physical environments.',
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
      'Cloud & Platforms',
      'AI Value Realization',
      'Technology Strategy',
    ],
  },
  {
    category: 'Strategy',
    skills: [
      'Strategic Accounts',
      'Multi-Year Account Strategy',
      'Enterprise Transformation',
      'Growth & Opportunity Development',
    ],
  },
  {
    category: 'Leadership',
    skills: [
      'Executive Partnerships',
      'Cross-Functional Orchestration',
      'Organizational Alignment',
      'Transformation at Scale',
    ],
  },
  {
    category: 'Commercial',
    skills: [
      'Complex Deal Structuring',
      'Value Negotiation',
      'Platform Economics',
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
    institution: 'Bauman State Technical University',
    type: 'Master',
    logo: getLogoUrl('bmstu.ru'),
  },
  {
    id: 'bmstu-bs-ce',
    degree: "Bachelor's degree, Computer Engineering",
    institution: 'Bauman State Technical University',
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
    id: 'azure-solutions-architect',
    name: 'Microsoft Certified: Azure Solutions Architect Expert',
    issuer: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
  },
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
    awardLevel: '2× Platinum · 3× Gold',
    description:
      'Recognition for sustained customer impact, revenue growth, and top-tier performance.',
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
    awardLevel: '7× (through 2024) · 2025 · 2026',
    description: 'Achieved 100% cumulative tenured weighted attainment on a sales quota plan.',
    color: 'green',
    badges: [
      { src: '/Awards/100Attainmentretired_7Time.png', alt: '100% Attainment 7-time winner badge' },
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
  { value: 5, suffix: '×', label: 'Top-Performer Awards' },
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
