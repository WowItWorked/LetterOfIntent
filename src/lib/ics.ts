/**
 * Builds a one-event iCalendar file: "Review the Letter of Intent", one year
 * from `now`, as an all-day event. Hand-rolled (RFC 5545) so no dependency
 * and nothing leaves the device.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** RFC 5545 text escaping: backslash, semicolon, comma, newline. */
export function escapeIcsText(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Folds lines longer than 74 octets with CRLF + space (RFC 5545 §3.1). */
export function foldIcsLine(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 0) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join("\r\n");
}

export interface ReviewReminder {
  filename: string;
  content: string;
}

export function buildReviewReminderIcs(personLabel: string, now: Date): ReviewReminder {
  const next = new Date(now);
  next.setFullYear(next.getFullYear() + 1);
  const start = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  const dayAfter = new Date(next);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const end = `${dayAfter.getFullYear()}${pad(dayAfter.getMonth() + 1)}${pad(dayAfter.getDate())}`;
  const stamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const uid = `loi-review-${start}-${Math.random().toString(36).slice(2, 10)}@local`;

  const summary = escapeIcsText(`Review ${personLabel}'s Letter of Intent`);
  const description = escapeIcsText(
    "A yearly check-in: open the Letter of Intent, update anything that changed " +
      "(medications, contacts, routines, benefits), change the date, and print or " +
      "share the new version. Fifteen minutes now saves a future caregiver from " +
      "outdated information."
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Letter of Intent Builder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return {
    filename: "letter-of-intent-yearly-review.ics",
    content: lines.map(foldIcsLine).join("\r\n") + "\r\n",
  };
}

/* ------------------------------------------------------- hosted calendars */

const REMINDER_BODY =
  "A yearly check-in: open the Letter of Intent, update anything that changed " +
  "(medications, contacts, routines, benefits), change the date, and print or share " +
  "the new version.";

/**
 * The title used on Google's and Outlook's servers. Deliberately impersonal.
 *
 * The .ics file is built and read on this device, so it can carry the person's
 * name. These two links are different in kind: following one hands the title
 * to a third party, and "Review Alex's Letter of Intent" sitting in a Google
 * account discloses a name and, by implication, a disability. The event is
 * just as useful without it.
 */
export const HOSTED_CALENDAR_TITLE = "Review the Letter of Intent";

/**
 * Deep links for the two calendars that live on the web. Only a fixed title
 * and a date travel there — nothing from the letter, and no name.
 */
export function calendarLinks(now: Date, appUrl: string) {
  const next = new Date(now);
  next.setFullYear(next.getFullYear() + 1);
  const day = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  const after = new Date(next);
  after.setDate(after.getDate() + 1);
  const dayAfter = `${after.getFullYear()}${pad(after.getMonth() + 1)}${pad(after.getDate())}`;

  const title = HOSTED_CALENDAR_TITLE;
  const details = `${REMINDER_BODY}\n\n${appUrl}`;
  const enc = encodeURIComponent;

  return {
    google:
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${enc(title)}&dates=${day}/${dayAfter}&details=${enc(details)}`,
    outlook:
      "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose" +
      `&rru=addevent&allday=true&subject=${enc(title)}` +
      `&startdt=${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}` +
      `&enddt=${after.getFullYear()}-${pad(after.getMonth() + 1)}-${pad(after.getDate())}` +
      `&body=${enc(details)}`,
  };
}
