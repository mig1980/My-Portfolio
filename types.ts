/**
 * @fileoverview Type definitions for the AboutMe portfolio application.
 * @description Contains all shared TypeScript interfaces used across components.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import type React from 'react';

/**
 * Represents a professional job role/position.
 * Used in the Experience section to display work history.
 */
export interface JobRole {
  title: string;
  company: string;
  logo?: string;
  period: string;
  description: string[];
}

/**
 * Represents a category of skills with associated icon.
 * Used in the Expertise section to display competency areas.
 */
export interface SkillGroup {
  /** Category name (e.g., "Technical Skills", "Leadership") */
  category: string;
  /** Array of individual skill names */
  skills: string[];
  /** React icon component for visual representation */
  icon: React.ReactNode;
}

/**
 * Represents an educational qualification.
 * Used in the Education section to display academic background.
 */
export interface EducationItem {
  /** Name of the degree or program */
  degree: string;
  /** Name of the educational institution */
  institution: string;
  /** Type of qualification */
  type: 'Master' | 'Bachelor' | 'Certification';
  /** URL to institution logo (optional) */
  logo?: string;
  /** URL to diploma/degree verification (optional) */
  url?: string;
}

/**
 * Represents a professional certification.
 * Used in the Education section to display credentials.
 */
export interface Certification {
  /** Name of the certification */
  name: string;
  /** Organization that issued the certification */
  issuer?: string;
  /** URL to issuer logo (optional) */
  logo?: string;
  /** URL to certificate verification or details (optional) */
  url?: string;
}

/**
 * Represents a thought leadership content item (article, talk, etc.).
 * Used in the ThoughtLeadership section to showcase publications.
 */
export interface ThoughtLeadershipItem {
  /** Title of the content piece */
  title: string;
  /** Type of content (e.g., "Article", "Conference Talk") */
  type: string;
  /** Brief description of the content (optional) */
  description?: string;
  /** External URL to the full content */
  link?: string;
}

/**
 * Represents a social media or contact link.
 * Used in the Contact section for social connectivity.
 */
export interface SocialLink {
  /** Platform name (e.g., "LinkedIn", "GitHub") */
  platform: string;
  /** Full URL or mailto link */
  url: string;
  /** Accessible label for screen readers */
  label: string;
  /** React icon component for the platform */
  icon: React.ReactNode;
}

/**
 * Represents a professional award or recognition.
 * Used in the About section to highlight achievements.
 */
export interface AwardItem {
  /** Unique identifier for the award (for React key) */
  id: string;
  /** Name of the award */
  title: string;
  /** Organization that granted the award */
  issuer: string;
  /** Level or tier of the award (e.g., "Platinum", "Gold") */
  awardLevel: string;
  /** Brief description of the achievement */
  description: string;
  /** Visual theme color for the award card */
  color?: 'platinum' | 'gold' | 'blue' | 'green' | 'purple';
  /** Optional link to award details */
  link?: string;
  /** Optional path to badge image (e.g., '/awards/PlatinumClub.png') */
  badgeUrl?: string;
}

/**
 * Represents a personal interest or hobby.
 * Used in the About section to add personality.
 */
export interface InterestItem {
  /** Name of the interest */
  label: string;
  /** React icon component representing the interest */
  icon: React.ReactNode;
}

/**
 * Represents a statistic for animated display.
 * Used in the Stats section to highlight key achievements.
 */
export interface StatItem {
  /** Numeric value to animate to */
  value: number;
  /** Optional suffix (e.g., '+', 'M+', 'x') */
  suffix?: string;
  /** Optional prefix (e.g., '$') */
  prefix?: string;
  /** Label describing the statistic */
  label: string;
}

// ============================================================================
// Chat Types - Used by ChatWidget and useChat hook
// ============================================================================

/**
 * Represents a chat message in the AI assistant conversation.
 * Used in the ChatWidget component for message display.
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string;
  /** Message sender role */
  role: 'user' | 'assistant';
  /** Message text content */
  content: string;
  /** When the message was created */
  timestamp: Date;
}

/**
 * Chat history item format for API requests.
 * Uses 'model' instead of 'assistant' to match Gemini API format.
 * @internal Used by useChat hook
 */
export interface ChatHistoryItem {
  /** Role in the conversation */
  role: 'user' | 'model';
  /** Message content */
  content: string;
}

/**
 * API request format for chat endpoint.
 * @internal Used by useChat hook
 */
export interface ChatApiRequest {
  /** User's message text */
  message: string;
  /** Previous conversation history */
  history?: ChatHistoryItem[];
}

/**
 * API response format from chat endpoint.
 * Uses discriminated union for type-safe response handling.
 * @internal Used by useChat hook
 */
export type ChatApiResponse =
  | { reply: string; suggestions?: string[]; error?: never }
  | {
      error: string;
      retryAfterMs?: number;
      attemptedModels?: string[];
      reply?: never;
      suggestions?: never;
    };
