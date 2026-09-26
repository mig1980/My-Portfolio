/**
 * @fileoverview Cross-component bridge for asking the lazy-loaded ChatWidget a question.
 */

import type { ChatAskDetail } from '../types';

/** Window event name the ChatWidget listens for */
export const CHAT_ASK_EVENT = 'chat:ask';

/**
 * Opens the chat widget and sends the given question.
 * @param question - Question text to send
 */
export function askChat(question: string): void {
  window.dispatchEvent(new CustomEvent<ChatAskDetail>(CHAT_ASK_EVENT, { detail: { question } }));
}
