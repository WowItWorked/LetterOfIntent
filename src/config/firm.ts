/**
 * Firm configuration — every user-facing mention of the firm reads from this
 * file so the tool can be white-labeled by editing one place.
 */

export interface FirmBrand {
  /** Primary brand color (headers, buttons). */
  navy: string;
  /** Near-black navy for text on light backgrounds. */
  navyDeep: string;
  /** Metallic accent. */
  gold: string;
  /** Darker accent for hover/pressed states. */
  goldDeep: string;
  /** Warm ivory page background. */
  paper: string;
  /** Primary text color. */
  ink: string;
}

export interface FirmConfig {
  name: string;
  shortName: string;
  attorneyName: string;
  phone: string;
  phoneHref: string;
  email: string;
  website: string;
  websiteLabel: string;
  /**
   * Where this tool itself lives. Used for canonical URLs, link previews,
   * and the sitemap — so it must be the public production address.
   */
  appUrl: string;
  appUrlLabel: string;
  /** Where the single post-download call to action points. */
  consultUrl: string;
  licensedStates: string[];
  /** The firm's monogram. Path under /public, or null to hide it. */
  logoPath: string | null;
  /**
   * The tool's own lockup, used on the documents families keep. Path under
   * /public, or null to fall back to the firm monogram.
   */
  appLogoPath: string | null;
  brand: FirmBrand;
  attorneyBioBlurb: string;
  /** One-line privacy promise shown in the header and on the first screen. */
  privacyPromise: string;
  /** Site + PDF disclaimer (short form). */
  disclaimerShort: string;
  /** Expanded disclaimer for the privacy/legal page and the PDF's how-to page. */
  disclaimerFull: string;
  /** Attorney advertising notice, or null if not required. */
  advertisingNotice: string | null;
}

export const firm: FirmConfig = {
  name: "Trusts & Wealth, PLLC",
  shortName: "Trusts & Wealth",
  attorneyName: "Claire Kelly, Esq.",
  phone: "(703) 745-5565",
  phoneHref: "tel:+17037455565",
  email: "contact@trustsandwealth.com",
  website: "https://trustsandwealth.com",
  websiteLabel: "trustsandwealth.com",
  appUrl: "https://myletterofintent.com",
  appUrlLabel: "myletterofintent.com",
  consultUrl: "https://calendly.com/trustsandwealth/consultation",
  licensedStates: ["Virginia"],
  logoPath: "/monogram-gold.png",
  // The stacked lockup is the one the brand system puts on documents.
  appLogoPath: "/mloi-lockup-stacked.png",
  brand: {
    navy: "#253551",
    navyDeep: "#16223A",
    gold: "#C9A063",
    goldDeep: "#A87E45",
    paper: "#FBFAF6",
    ink: "#1A2233",
  },
  attorneyBioBlurb:
    "Claire Kelly, Esq. is an estate and tax planning attorney and the founder of " +
    "Trusts & Wealth, PLLC. Her practice includes special needs planning — special " +
    "needs trusts, public benefits, and guardianship — for Virginia families.",
  privacyPromise:
    "Everything you type stays on this device. We never see it, and it is never " +
    "sent anywhere. Download a backup file to keep it safe.",
  disclaimerShort:
    "This free tool is provided by Trusts & Wealth, PLLC for general information. " +
    "It does not give legal advice, and using it does not make you a client of the " +
    "firm. A Letter of Intent is not a legal document, and it is not a substitute " +
    "for a special needs trust or an estate plan.",
  disclaimerFull:
    "This tool is offered by Trusts & Wealth, PLLC as a free public resource. It " +
    "does not provide legal advice, and no attorney–client relationship is formed " +
    "by using it. A Letter of Intent is not a will, not a trust, and not legally " +
    "binding on anyone. It works best alongside — never instead of — a special " +
    "needs trust and a complete estate plan prepared with a qualified attorney in " +
    "your state. If you have questions about protecting a loved one's benefits or " +
    "future, talk with a special needs planning attorney.",
  advertisingNotice:
    "ATTORNEY ADVERTISING. Trusts & Wealth, PLLC is a Virginia law firm. This " +
    "tool describes legal concepts in general terms and is not a prediction or " +
    "guarantee of any outcome.",
};
