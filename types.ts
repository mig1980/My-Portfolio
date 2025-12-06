import React from 'react';

export interface JobRole {
  title: string;
  company: string;
  logo?: string;
  period: string;
  description: string[];
}

export interface SkillGroup {
  category: string;
  skills: string[];
  icon: React.ReactNode;
}

export interface EducationItem {
  degree: string;
  institution: string;
  type: 'Master' | 'Bachelor' | 'Certification';
}

export interface Certification {
  name: string;
  issuer?: string;
}

export interface ThoughtLeadershipItem {
  title: string;
  type: string;
  description: string;
  link?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
  icon: React.ReactNode;
}

export interface AwardItem {
  title: string;
  issuer: string;
  awardLevel: string;
  description: string;
  color?: 'platinum' | 'gold' | 'blue';
  link?: string;
}

export interface InterestItem {
  label: string;
  icon: React.ReactNode;
}