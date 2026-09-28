/**
 * @fileoverview Fit-check limits shared by the dialog and the fit API.
 * @description Keep this file free of DOM and React imports: the Cloudflare function imports it too.
 */

/** Characters a job description must have after trimming */
export const MIN_JOB_DESCRIPTION_LENGTH = 200;

/** Maximum characters in a job description */
export const MAX_JOB_DESCRIPTION_LENGTH = 8000;
