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
} from './types';
import {
  Briefcase,
  Brain,
  Cloud,
  TrendingUp,
  Linkedin,
  Mail,
  BookOpen,
  Waves,
  Dumbbell,
  Mountain,
  Flag,
} from 'lucide-react';

/**
 * Personal information displayed in Hero and Contact sections.
 */
export const PERSONAL_INFO = {
  name: 'Michael Gavrilov',
  title: 'Strategic Account Director at Microsoft',
  subtitle: 'Helping enterprise leaders turn AI strategy into adoption',
  location: 'New York City',
  summary: `Strategic Account Director at Microsoft, leading Fortune 500 AI transformations—bridging executive strategy and generative AI implementation to deliver measurable outcomes.

  Over more than two decades, I’ve led multi-year programs and negotiated complex enterprise partnerships—building executive sponsorship and driving adoption at scale.

  With a background spanning engineering and business management, I translate advanced technology into outcomes—from strategy to implementation.`,
};

export const EXPERIENCE: JobRole[] = [
  {
    title: 'Strategic Account Director | Healthcare & Life Sciences',
    company: 'Microsoft',
    logo: 'https://logo.clearbit.com/microsoft.com',
    period: 'Jan 2017 - Present',
    description: [
      'Lead AI transformation for a strategic pharmaceutical customer, aligning Microsoft’s advanced technologies with client priorities.',
      'Orchestrate cross-functional teams and engage directly with C-level stakeholders to accelerate innovation.',
      'Develop and execute long-term account strategies, closing multi-year strategic partnerships totaling $250M+ TCV.',
      'Build and sustain trusted executive relationships across global accounts, unlocking new opportunities.',
    ],
  },
  {
    title: 'Senior Account Executive',
    company: 'Microsoft',
    logo: 'https://logo.clearbit.com/microsoft.com',
    period: 'Apr 2011 - Jan 2017',
    description: [
      'Managed robust sales pipelines and guided high-performing teams across Sales, Engineering, and Delivery.',
      'Consistently exceeded revenue targets, generating an average of $20M annually across Pharma, Transportation, and Manufacturing sectors.',
      'Developed trusted relationships with executive stakeholders across multiple industries.',
    ],
  },
  {
    title: 'Account Technology Strategist',
    company: 'Microsoft',
    logo: 'https://logo.clearbit.com/microsoft.com',
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
    logo: 'https://logo.clearbit.com/microsoft.com',
    period: 'Oct 2006 - July 2008',
    description: [
      'Developed impactful go-to-market strategies driving partner growth and revenue.',
      'Led programs resulting in a 150% increase in partner-influenced revenue.',
      'Cultivated technical relationships with CTOs/CIOs to understand strategic challenges.',
    ],
  },
  {
    title: 'IT Solutions Architect',
    company: 'Systematica Group',
    logo: 'https://ui-avatars.com/api/?name=Systematica+Group&background=0f172a&color=cbd5e1&bold=true',
    period: 'July 2005 - Oct 2006',
    description: [
      'Led architectural design and technical strategy for complex IT solutions in pre-sales engagements.',
      'Collaborated with sales teams and enterprise clients to align technology with business objectives.',
    ],
  },
  {
    title: 'IT Operations Manager / Team Lead',
    company: 'Allied Testing',
    logo: 'https://logo.clearbit.com/alliedtesting.com',
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
      'Digital Transformation',
      'Cross-functional Team Leadership',
    ],
  },
  {
    category: 'Artificial Intelligence',
    icon: <Brain className="w-5 h-5" />,
    skills: [
      'Generative AI Strategy',
      'Agentic AI & Copilots',
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
      'Enterprise SaaS',
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
];

/**
 * Educational background and degrees.
 * Displayed in the Education section.
 */
export const EDUCATION: EducationItem[] = [
  {
    degree: "Master's degree, Management of Technology",
    institution: 'New York University',
    type: 'Master',
  },
  {
    degree: 'Master’s degree, Information Systems Engineering',
    institution: 'Bauman Moscow State Technical University',
    type: 'Master',
  },
  {
    degree: 'Bachelor’s degree, Computer Engineering',
    institution: 'Bauman Moscow State Technical University',
    type: 'Bachelor',
  },
];

/**
 * Professional certifications and credentials.
 * Displayed in the Education section.
 */
export const CERTIFICATIONS: Certification[] = [
  { name: 'Microsoft Certified: Azure Solutions Architect Expert', issuer: 'Microsoft' },
  { name: 'Selling to the C-Suite', issuer: 'Wharton Executive Education' },
  { name: 'Insight Selling', issuer: 'Insight Selling' },
  { name: 'Value Negotiation', issuer: 'INSEAD' },
  { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services' },
];

/**
 * Professional awards and recognition.
 * Displayed in the About section.
 */
export const AWARDS: AwardItem[] = [
  {
    title: 'Platinum Club',
    issuer: 'Microsoft',
    awardLevel: '2x Recipient',
    description:
      'Honored twice for exceptional performance, awarded to the top tier of achievers worldwide.',
    color: 'platinum',
  },
  {
    title: 'Gold Club Award',
    issuer: 'Microsoft',
    awardLevel: 'Top Performer',
    description:
      'Awarded for outstanding contribution to revenue growth and strategic customer impact.',
    color: 'gold',
  },
  {
    title: 'Strategic Deal Maker',
    issuer: 'Impact',
    awardLevel: '$250M+ TCV',
    description:
      'Architected and closed complex multi-year strategic partnerships totaling $250M+ in total contract value (TCV).',
    color: 'blue',
  },
];

/**
 * Personal interests and hobbies.
 * Displayed in the About section.
 */
export const INTERESTS: InterestItem[] = [
  { label: 'Continuous Learning', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Swimming', icon: <Waves className="w-4 h-4" /> },
  { label: 'Boxing', icon: <Dumbbell className="w-4 h-4" /> },
  { label: 'Horseback Riding', icon: <Mountain className="w-4 h-4" /> },
  { label: 'Golf', icon: <Flag className="w-4 h-4" /> },
];

/**
 * Thought leadership content (articles, publications, talks).
 * Displayed in the ThoughtLeadership section.
 */
export const THOUGHT_LEADERSHIP: ThoughtLeadershipItem[] = [
  {
    title: 'QuantumInvestor',
    type: 'Blog / Publication',
    description:
      'A public, AI-managed portfolio experiment benchmarked against the S&P 500—weekly picks, performance updates, and full documentation.',
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
    url: 'mailto:michael@gavrilov.ai',
    label: 'Send an email',
    icon: <Mail className="w-5 h-5" />,
  },
];
