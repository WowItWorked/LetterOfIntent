import { firm } from "@/config/firm";

/**
 * The pre-written share message. Sharing reveals nothing anyone has written —
 * these are static strings and a bare URL, with no letter data anywhere near
 * them.
 *
 * Facebook and LinkedIn strip pre-filled text and show the page's own meta
 * description instead, which is why that description has to read as an
 * invitation on its own.
 */
export const SHARE_URL = firm.appUrl;

const SHARE_INTRO = "I thought you might find this helpful.";

const SHARE_WHAT =
  "My Letter of Intent is a free tool for writing down what a future caregiver would " +
  "need to know about someone you love: routines, medical details, what calms them, " +
  "who to call. One small question at a time, and it finishes as a document you can " +
  "print. Everything you write stays private on your own device.";

export const SHARE_MESSAGE = `${SHARE_INTRO} ${SHARE_WHAT}`;

/** X counts characters, so it gets a trimmed variant. */
const SHARE_SHORT =
  `${SHARE_INTRO} A free tool for writing down what a future caregiver would need to ` +
  "know about someone you love: routines, medical details, what calms them, who to " +
  "call. One question at a time, and it stays private on your own device.";

const SHARE_TITLE = "A free tool for writing a Letter of Intent";

const enc = encodeURIComponent;

export interface ShareTarget {
  key: string;
  label: string;
  href: string;
  /** SVG path data, drawn at 24×24. */
  path: string;
}

const MAIL_BODY = `${SHARE_INTRO}\n\n${SHARE_WHAT}\n\n${SHARE_URL}\n`;

export const shareTargets: ShareTarget[] = [
  {
    key: "facebook",
    label: "Share on Facebook",
    href: `https://www.facebook.com/sharer/sharer.php?u=${enc(SHARE_URL)}&quote=${enc(SHARE_MESSAGE)}`,
    path: "M13.4 21v-7.5h2.5l.4-2.9h-2.9V8.7c0-.8.2-1.4 1.4-1.4h1.6V4.7c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2H7.7v2.9h2.5V21h3.2Z",
  },
  {
    key: "nextdoor",
    label: "Post on Nextdoor",
    href: `https://nextdoor.com/sharekit/?source=${firm.appUrlLabel}&body=${enc(`${SHARE_MESSAGE} ${SHARE_URL}`)}`,
    path: "M12 3.2 2.8 10.4h2.6V20h5.2v-5.6h2.8V20h5.2v-9.6h2.6L12 3.2Zm0 2 6.2 4.9v8.3h-2.2v-5.6H8.9V18.4H6.7v-8.3L12 5.2Z",
  },
  {
    key: "reddit",
    label: "Post to Reddit",
    href: `https://www.reddit.com/submit?url=${enc(SHARE_URL)}&title=${enc(`${SHARE_TITLE} for someone you care for`)}`,
    path: "M14.5 3.2a1.9 1.9 0 0 0-1.8 2.6l-.9 4.1c-1.9.1-3.6.6-4.9 1.5a2 2 0 1 0-2.4 3.3c0 .2-.1.4-.1.6 0 3.1 3.4 5.5 7.6 5.5s7.6-2.4 7.6-5.5c0-.2 0-.4-.1-.6a2 2 0 1 0-2.4-3.3c-1.3-.9-3-1.4-4.9-1.5l.8-3.5 2.5.6a1.5 1.5 0 1 0 .2-1.5l-3-.7a1.9 1.9 0 0 0-1.2-1.6Zm-5.2 9.9a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Zm5.4 0a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Zm-5.3 4.4c.9.8 2.1 1.1 3.2 1.1 1.1 0 2.3-.3 3.2-1.1l.7.6c-1.1 1-2.5 1.4-3.9 1.4s-2.8-.4-3.9-1.4l.7-.6Z",
  },
  {
    key: "x",
    label: "Share on X",
    href: `https://twitter.com/intent/tweet?url=${enc(SHARE_URL)}&text=${enc(SHARE_SHORT)}`,
    path: "M17.6 4h2.7l-5.9 6.8L21.4 20h-5.4l-4.2-5.5L6.9 20H4.2l6.3-7.2L3.9 4h5.6l3.8 5 4.3-5Zm-1 14.4h1.5L8.5 5.5H6.9l9.7 12.9Z",
  },
  {
    key: "linkedin",
    label: "Share on LinkedIn",
    href: `https://www.linkedin.com/feed/?shareActive=true&text=${enc(`${SHARE_MESSAGE} ${SHARE_URL}`)}`,
    path: "M6.9 20H4.1V8.9h2.8V20ZM5.5 7.7A1.7 1.7 0 1 1 5.5 4.3a1.7 1.7 0 0 1 0 3.4ZM20 20h-2.8v-5.6c0-1.4-.5-2.3-1.7-2.3-.9 0-1.5.6-1.7 1.3-.1.2-.1.5-.1.8V20H10.9s0-9.4 0-11.1h2.8v1.6c.4-.6 1.1-1.5 2.7-1.5 2 0 3.6 1.3 3.6 4.2V20Z",
  },
  {
    key: "whatsapp",
    label: "Send on WhatsApp",
    href: `https://wa.me/?text=${enc(`${SHARE_MESSAGE} ${SHARE_URL}`)}`,
    path: "M12 3.5a8.4 8.4 0 0 0-7.2 12.7L3.5 21l4.9-1.3A8.4 8.4 0 1 0 12 3.5Zm0 1.6a6.8 6.8 0 0 1 5.7 10.5 6.8 6.8 0 0 1-8.9 2.3l-.4-.2-2.6.7.7-2.5-.2-.4A6.8 6.8 0 0 1 12 5.1Zm-2.9 3.3c-.2 0-.4 0-.6.3-.2.2-.8.7-.8 1.8s.8 2.1.9 2.2c.1.2 1.5 2.5 3.8 3.4 1.9.7 2.3.6 2.7.5.4 0 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1l-.5-.3-1.4-.7c-.2 0-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a5.6 5.6 0 0 1-2.8-2.4c-.2-.3 0-.5.1-.6l.4-.5.2-.4v-.4l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5Z",
  },
  {
    key: "email",
    label: "Write an email",
    href: `mailto:?subject=${enc(SHARE_TITLE)}&body=${enc(MAIL_BODY)}`,
    path: "M4 5h16a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H4a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 4 5Zm.8 2.3 7.2 5.1 7.2-5.1H4.8Zm15 1.6-7.4 5.2a.8.8 0 0 1-.8 0L4.2 8.9v8.4h15.6V8.9Z",
  },
  {
    key: "sms",
    label: "Send a text message",
    href: `sms:?&body=${enc(`${SHARE_MESSAGE} ${SHARE_URL}`)}`,
    path: "M12 4c-4.6 0-8.3 3.1-8.3 7 0 2.2 1.2 4.2 3.1 5.5V21l3.1-1.8c.7.1 1.4.2 2.1.2 4.6 0 8.3-3.1 8.3-7s-3.7-7-8.3-7Zm0 1.6c3.7 0 6.7 2.4 6.7 5.4s-3 5.4-6.7 5.4c-.7 0-1.4-.1-2-.3l-.4-.1-1.8 1v-1.9l-.4-.3c-1.6-1-2.5-2.5-2.5-4.1 0-3 3-5.4 6.7-5.4Z",
  },
];

export const nativeShareData = {
  title: "My Letter of Intent",
  text: SHARE_MESSAGE,
  url: SHARE_URL,
};
