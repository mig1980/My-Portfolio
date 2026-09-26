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
import {
  Cpu,
  TrendingUp,
  Linkedin,
  Mail,
  Dumbbell,
  Lightbulb,
  Users,
  Handshake,
} from 'lucide-react';
import { getLogoUrl } from './utils/logo';

/**
 * Personal information displayed in Hero and Contact sections.
 */
export const PERSONAL_INFO = {
  name: 'Michael Gavrilov',
  tagline: 'Engineer at heart.',
  taglineHighlight: 'Dealmaker by instinct.',
  title: 'Strategic Account Director at Microsoft',
  location: 'New York City',
  focus: 'Technology · AI · Strategy',
  intro: 'I help global enterprises turn ambitious technology into business reality.',
  resumeUrl: '/CV/Michael-Gavrilov-Resume.pdf',
  summary: `I started my career building and operating technology. I became an architect, strategist and eventually a dealmaker.

The mindset never really changed: understand the problem, challenge assumptions, design a solution and make it work.`,
  summaryEmphasis: 'Today, the systems are just bigger.',
};

/**
 * Suggested questions shown under the hero ask box and in the chat widget.
 */
export const SUGGESTED_QUESTIONS: readonly string[] = [
  'How did Michael go from engineer to dealmaker?',
  "What's his philosophy on enterprise AI?",
  'What has Michael actually built?',
  'What does he believe about complex deals?',
];

/**
 * Career progression, oldest first. Each role in EXPERIENCE maps to one stage.
 */
export const CAREER_STAGES: readonly CareerStage[] = [
  { name: 'Engineer', summary: 'Building systems' },
  { name: 'Architect', summary: 'Architecting solutions' },
  { name: 'Strategist', summary: 'Shaping strategy' },
  { name: 'Dealmaker', summary: 'Building businesses' },
];

export const EXPERIENCE: JobRole[] = [
  {
    id: 'msft-sad-hls',
    title: 'Strategic Account Director | Healthcare & Life Sciences',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Jan 2017 - Present',
    stage: 'Dealmaker',
    description: [
      'Lead the AI agenda for a key pharmaceutical customer, aligning Microsoft’s advanced technologies with client priorities.',
      'Lead a cross-functional virtual team across Azure, Microsoft 365 (including Copilot), and Security to deliver targeted business outcomes.',
      'Navigate complex, multi-stakeholder negotiations with senior executives to unlock AI adoption.',
      'Challenge legacy assumptions with data-driven, security-aware recommendations—accelerating adoption without increasing risk.',
      'Architect novel deal structures involving product partnerships and multi-year revenue commitments totaling more than $500M.',
      'Build and sustain trusted executive relationships across global accounts, unlocking new opportunities.',
    ],
  },
  {
    id: 'msft-sae',
    title: 'Senior Account Executive | Enterprise Accounts',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Apr 2011 - Jan 2017',
    stage: 'Dealmaker',
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
    icon: <Cpu className="w-5 h-5" />,
    skills: ['AI', 'Cloud', 'Platforms', 'Security'],
  },
  {
    category: 'Business',
    icon: <TrendingUp className="w-5 h-5" />,
    skills: ['Strategy', 'Transformation', 'Economics', 'Growth'],
  },
  {
    category: 'Leadership',
    icon: <Users className="w-5 h-5" />,
    skills: ['Executives', 'Organizations', 'Ecosystems', 'Alignment'],
  },
  {
    category: 'Deals',
    icon: <Handshake className="w-5 h-5" />,
    skills: ['Partnerships', 'Negotiation', 'Value', 'Scale'],
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
    institution: 'Bauman Moscow State Technical University',
    type: 'Master',
    logo: getLogoUrl('bmstu.ru'),
  },
  {
    id: 'bmstu-bs-ce',
    degree: "Bachelor's degree, Computer Engineering",
    institution: 'Bauman Moscow State Technical University',
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
    id: 'platinum-club',
    title: 'Platinum Club',
    issuer: 'Microsoft',
    awardLevel: '2x Recipient',
    description:
      'Honored twice for exceptional performance, awarded to the top tier of achievers worldwide.',
    color: 'platinum',
    badgeUrl: '/Awards/PlatinumClub.png',
  },
  {
    id: 'gold-club',
    title: 'Gold Club Award',
    issuer: 'Microsoft',
    awardLevel: '2x Recipient',
    description:
      'Awarded for outstanding contribution to revenue growth and strategic customer impact.',
    color: 'gold',
    badgeUrl: '/Awards/GoldClub.png',
    link: '/Awards/Gold_Club_Award_Letter.pdf',
  },
  {
    id: 'champion',
    title: 'Champion Award',
    issuer: 'Microsoft',
    awardLevel: 'FY23 Q4',
    description:
      'Transformational Deals as One Microsoft—recognized for driving cloud-first approach on a strategic enterprise engagement.',
    color: 'purple',
    badgeUrl: '/Awards/Champion.png',
    link: '/Awards/Champion_Award_Letter.pdf',
  },
  {
    id: 'attainment-100',
    title: '100% Attainment',
    issuer: 'Microsoft',
    awardLevel: 'FY25',
    description: 'Achieved 100% cumulative tenured weighted attainment on a sales quota plan.',
    color: 'green',
    badgeUrl: '/Awards/100Attainment.png',
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
    items: ['Snowboarding', 'Boxing', 'Swimming', 'Golf', 'Horseback riding'],
  },
  {
    id: 'learning',
    icon: <Lightbulb className="w-5 h-5" />,
    items: ['Technology', 'Investing', 'Writing', 'Building'],
  },
];

/**
 * Key statistics for animated display.
 * Displayed in the Stats section below Hero.
 */
export const STATS: StatItem[] = [
  { value: 20, suffix: '+', label: 'Years Experience' },
  { value: 500, prefix: '$', suffix: 'M+', label: 'In Multi-Year Agreements' },
  { value: 4, suffix: '×', label: 'Top-Performer Awards' },
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
