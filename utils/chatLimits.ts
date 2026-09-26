/**
 * @fileoverview Chat limits shared by the browser (hero box, chat input) and the chat API.
 * @description Keep this file free of DOM and React imports: the Cloudflare function imports it too.
 */

/** Maximum characters in a single chat message */
export const MAX_CHAT_MESSAGE_LENGTH = 500;
