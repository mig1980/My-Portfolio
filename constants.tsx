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
  InterestItem,
  StatItem,
} from './types';
import {
  Briefcase,
  Brain,
  Cloud,
  TrendingUp,
  Linkedin,
  Mail,
  BookOpen,
  Dumbbell,
  LineChart,
  Handshake,
} from 'lucide-react';
import { getLogoUrl } from './utils/logo';

/**
 * Personal information displayed in Hero and Contact sections.
 */
export const PERSONAL_INFO = {
  name: 'Michael Gavrilov',
  tagline: 'Engineer at heart.',
  taglineHighlight: 'Transformational dealmaker.',
  title: 'Strategic Account Director at Microsoft',
  location: 'New York City',
  summary: `Started as an engineer. Became a dealmaker. Never lost the builder's mindset.

I've spent two decades translating between the language of technology and the language of business—helping Fortune 500 leaders see what's possible, then making it real.

Whether architecting solutions or negotiating multi-year partnerships, I bring the same approach: listen deeply, cut through complexity, and deliver what I promised.`,
};

export const EXPERIENCE: JobRole[] = [
  {
    title: 'Strategic Account Director | Healthcare & Life Sciences',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Jan 2017 - Present',
    description: [
      'Lead AI transformation for a strategic pharmaceutical customer, aligning Microsoft’s advanced technologies with client priorities.',
      'Lead a cross-functional virtual team across Azure, Microsoft 365 (including Copilot), and Security to deliver targeted business outcomes.',
      'Navigate complex, multi-stakeholder negotiations with C-suite executives to unlock transformational AI adoption.',
      'Challenge legacy assumptions with data-driven, security-aware recommendations—accelerating adoption without increasing risk.',
      'Architect novel deal structures involving product partnerships and multi-year revenue commitments totaling $250M+ TCV.',
      'Build and sustain trusted executive relationships across global accounts, unlocking new opportunities.',
    ],
  },
  {
    title: 'Senior Account Executive | Enterprise Accounts',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Apr 2011 - Jan 2017',
    description: [
      'Managed robust sales pipelines and guided high-performing teams across Sales, Engineering, and Delivery.',
      'Consistently exceeded revenue targets, generating an average of $20M annually across Pharma, Transportation, and Manufacturing sectors.',
      'Developed trusted relationships with executive stakeholders across multiple industries.',
    ],
  },
  {
    title: 'Account Technology Strategist | Enterprise Accounts',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'July 2008 - Mar 2011',
    description: [
      'Advised senior executives on AI-driven technology strategies aligning with business goals.',
      'Drove adoption strategies, ensuring sustained momentum and value realization.',
      'Executed tailored sales strategies, consistently exceeding targets and securing contract renewals.',
    ],
  },
  {
    title: 'Partner Technology Strategist',
    company: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
    period: 'Oct 2006 - July 2008',
    description: [
      'Structured platform partnerships and joint go-to-market strategies driving partner growth and revenue.',
      'Led programs resulting in a 150% increase in partner-influenced revenue.',
      'Cultivated technical relationships with CTOs/CIOs to understand strategic challenges.',
    ],
  },
  {
    title: 'IT Solutions Architect',
    company: 'Systematica Group',
    logo: getLogoUrl('systematic.ru'),
    period: 'July 2005 - Oct 2006',
    description: [
      'Led architectural design and technical strategy for complex IT solutions in pre-sales engagements.',
      'Collaborated with sales teams and enterprise clients to align technology with business objectives.',
    ],
  },
  {
    title: 'IT Operations Manager | Team Lead',
    company: 'Allied Testing',
    logo: getLogoUrl('alliedtesting.com'),
    period: 'Apr 2002 - July 2005',
    description: [
      'Led a team of systems engineers to deliver process improvements and automation, increasing operational efficiency by 25%.',
      'Managed IT services and operations for virtual and physical environments.',
    ],
  },
];

/**
 * Professional skills grouped by category.
 * Displayed in the Expertise section.
 */
export const SKILLS: SkillGroup[] = [
  {
    category: 'Strategic Leadership',
    icon: <Briefcase className="w-5 h-5" />,
    skills: [
      'Complex Deal Closure ($250M+ TCV)',
      'C-Suite Partnerships',
      'AI-First Enterprise Strategy',
      'Cross-functional Team Leadership',
    ],
  },
  {
    category: 'Artificial Intelligence',
    icon: <Brain className="w-5 h-5" />,
    skills: [
      'Generative AI Strategy',
      'Copilot Enablement',
      'AI Value Realization',
      'AI Business Integration',
    ],
  },
  {
    category: 'Cloud & Tech',
    icon: <Cloud className="w-5 h-5" />,
    skills: [
      'Azure Cloud Strategy',
      'Solutions Architecture',
      'Agentic AI',
      'Data & Security Compliance',
    ],
  },
  {
    category: 'Sales Mastery',
    icon: <TrendingUp className="w-5 h-5" />,
    skills: [
      'Value Negotiation',
      'Strategic Account Planning',
      'Go-to-Market Strategy',
      'Insight Selling',
    ],
  },
  {
    category: 'Partnership & Deals',
    icon: <Handshake className="w-5 h-5" />,
    skills: [
      'Transformational Partnerships',
      'Novel Deal Structures',
      'Platform Economics',
      'B2B Ecosystem Development',
    ],
  },
];

/**
 * Educational background and degrees.
 * Displayed in the Education section.
 */
export const EDUCATION: EducationItem[] = [
  {
    degree: "Master's degree, Management of Technology",
    institution: 'New York University Tandon School of Engineering',
    type: 'Master',
    logo: getLogoUrl('nyu.edu'),
  },
  {
    degree: "Master's degree, Information Systems Engineering",
    institution: 'Bauman Moscow State Technical University',
    type: 'Master',
    logo: getLogoUrl('bmstu.ru'),
  },
  {
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
    name: 'Microsoft Certified: Azure Solutions Architect Expert',
    issuer: 'Microsoft',
    logo: getLogoUrl('microsoft.com'),
  },
  {
    name: 'Selling to the C-Suite',
    issuer: 'Wharton Executive Education',
    logo: getLogoUrl('wharton.upenn.edu'),
  },
  {
    name: 'Business Strategy and Financial Acumen',
    issuer: 'INSEAD Executive Education',
    logo: getLogoUrl('insead.edu'),
  },
  {
    name: 'Value Negotiation',
    issuer: 'INSEAD Executive Education',
    logo: getLogoUrl('insead.edu'),
  },
  {
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
 * Personal interests and hobbies.
 * Displayed in the About section.
 */
export const INTERESTS: InterestItem[] = [
  { label: 'Continuous Learning', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Investing', icon: <LineChart className="w-4 h-4" /> },
  { label: 'Active Lifestyle', icon: <Dumbbell className="w-4 h-4" /> },
];

/**
 * Key statistics for animated display.
 * Displayed in the Stats section below Hero.
 */
export const STATS: StatItem[] = [
  { value: 20, suffix: '+', label: 'Years Experience' },
  { value: 250, prefix: '$', suffix: 'M+', label: 'TCV Closed' },
  { value: 2, suffix: 'x', label: 'Microsoft Platinum Club' },
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
