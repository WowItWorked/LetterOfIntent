/**
 * Google Analytics 4.
 *
 * One measurement ID in one place, so the privacy page, the CSP, and the
 * egress test can all refer to the same fact.
 *
 * What this does and does not see, stated here because the privacy page makes
 * the same promise to families and the two must not drift:
 *
 * - It records that a page was opened, roughly where from, and on what kind of
 *   device. That is the ordinary GA4 page_view.
 * - It cannot see the letter. Nothing typed into a field is ever passed to
 *   `gtag`, there is no event that carries form values, and the letter never
 *   leaves localStorage or IndexedDB. Analytics counts visits; it does not
 *   read documents.
 *
 * Anyone changing this file should re-read `/privacy` section 04 and
 * `SECURITY.md`, and keep them true.
 */
export const GA_MEASUREMENT_ID = "G-90YXKXB5TC";

/** Hosts GA needs. The CSP and the egress test are both built from this. */
export const ANALYTICS_HOSTS = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
] as const;

/** Google's own permanent opt-out, offered on the privacy page. */
export const GA_OPT_OUT_URL = "https://tools.google.com/dlpage/gaoptout";
