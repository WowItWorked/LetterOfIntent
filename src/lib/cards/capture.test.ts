import { describe, expect, it, vi } from "vitest";
import {
  buildFontFaceCss,
  buildSvgMarkup,
  CaptureError,
  inlineResolvedFonts,
  pickFontUrl,
  toSvgDataUrl,
  type StyleSheetLike,
} from "@/lib/cards/capture";

/**
 * jsdom has no rasterizer: Image never decodes an SVG and canvas has no
 * drawing backend, so captureCardPng's pixel path cannot run here. That path
 * is proven by the care-card-raster spike (Chromium + WebKit, pixel-diffed
 * against ground truth in spikes/care-card-raster/verify.mjs) and will be
 * exercised end-to-end in Phase G. These tests cover the pure stages the
 * pixels depend on: font-css assembly, clone font inlining, and the SVG
 * markup/data-URL construction.
 */

function fontRule(
  family: string,
  src: string,
  extra: { style?: string; weight?: string; range?: string } = {}
) {
  const props: Record<string, string> = {
    "font-family": family,
    src,
    "font-style": extra.style ?? "normal",
    "font-weight": extra.weight ?? "400",
    "unicode-range": extra.range ?? "",
  };
  return {
    cssText: `@font-face { font-family: ${family}; }`,
    style: { getPropertyValue: (name: string) => props[name] ?? "" },
  };
}

function okFetch(bytes: number[] = [1, 2, 3]) {
  return vi.fn(async () => ({
    ok: true,
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  }));
}

const BASE = "https://app.example/letter/cards";

describe("pickFontUrl", () => {
  it("prefers the woff2 candidate among several sources", () => {
    const src =
      "url('/a.woff') format('woff'), url('/a.woff2') format('woff2'), url('/a.ttf') format('truetype')";
    expect(pickFontUrl(src)).toBe("/a.woff2");
  });

  it("falls back to the first url when no format is declared", () => {
    expect(pickFontUrl("url(/_next/static/media/x.woff2)")).toBe("/_next/static/media/x.woff2");
  });

  it("returns undefined for a src with no url() at all", () => {
    expect(pickFontUrl("local('Cinzel')")).toBeUndefined();
  });
});

describe("buildFontFaceCss", () => {
  it("embeds card-font faces as base64 data: URIs and skips unrelated families", async () => {
    const fetchImpl = okFetch();
    const sheets: StyleSheetLike[] = [
      {
        cssRules: [
          fontRule(
            "__Cinzel_ab12cd", // next/font hashes the family name
            "url(/_next/static/media/cinzel-sub.woff2) format('woff2')",
            { range: "U+0000-00FF" }
          ),
          fontRule("__Roboto_ffffff", "url(/_next/static/media/roboto.woff2) format('woff2')"),
          { cssText: ".not-a-font-face { color: red }", style: { getPropertyValue: () => "" } },
        ],
      },
    ];

    const css = await buildFontFaceCss(sheets, fetchImpl, BASE);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith("https://app.example/_next/static/media/cinzel-sub.woff2");
    expect(css).toContain("font-family:__Cinzel_ab12cd");
    expect(css).toContain("unicode-range:U+0000-00FF");
    // btoa of bytes [1,2,3]
    expect(css).toContain("data:font/woff2;base64,AQID");
    expect(css).not.toContain("Roboto");
  });

  it("resolves a relative src against the sheet that declares it, not the page", async () => {
    // next/font's production CSS lives at /_next/static/css/… and references
    // its fonts as url(../media/…). Resolved against the page URL that is a
    // 404 (/media/…) and capture dies at the fonts stage — Phase G measured
    // exactly that. The sheet's href is the base a browser would use.
    const fetchImpl = okFetch();
    const sheets: StyleSheetLike[] = [
      {
        href: "https://app.example/_next/static/css/abc123.css",
        cssRules: [
          fontRule("__Mulish_rel", "url(../media/mulish-sub.woff2) format('woff2')"),
        ],
      },
    ];
    const css = await buildFontFaceCss(sheets, fetchImpl, BASE);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://app.example/_next/static/media/mulish-sub.woff2"
    );
    expect(css).toContain("font-family:__Mulish_rel");
  });

  it("never fetches cross-origin, even if a matching family points there", async () => {
    const fetchImpl = okFetch();
    const sheets: StyleSheetLike[] = [
      {
        cssRules: [
          fontRule("__Mulish_x", "url(https://fonts.gstatic.com/m.woff2) format('woff2')"),
        ],
      },
    ];
    const css = await buildFontFaceCss(sheets, fetchImpl, BASE);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(css).toBe("");
  });

  it("skips sheets whose cssRules access throws (cross-origin stylesheets)", async () => {
    const hostile: StyleSheetLike = {
      get cssRules(): ArrayLike<unknown> {
        throw new Error("SecurityError");
      },
    };
    const fetchImpl = okFetch();
    const sheets: StyleSheetLike[] = [
      hostile,
      { cssRules: [fontRule("__Mulish_ok", "url(/m.woff2) format('woff2')")] },
    ];
    const css = await buildFontFaceCss(sheets, fetchImpl, BASE);
    expect(css).toContain("font-family:__Mulish_ok");
  });

  it("fails loudly at the fonts stage when a fetch comes back not-ok", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      arrayBuffer: async () => new ArrayBuffer(0),
    }));
    const sheets: StyleSheetLike[] = [
      { cssRules: [fontRule("__Cormorant_x", "url(/c.woff2) format('woff2')")] },
    ];
    await expect(buildFontFaceCss(sheets, fetchImpl, BASE)).rejects.toMatchObject({
      name: "CaptureError",
      stage: "fonts",
    });
  });
});

describe("inlineResolvedFonts", () => {
  it("copies each element's resolved font-family onto the matching clone node", () => {
    const source = document.createElement("div");
    source.style.fontFamily = "__Cinzel_test";
    const child = document.createElement("span");
    child.style.fontFamily = "__Mulish_test";
    child.textContent = "hello";
    source.appendChild(child);
    document.body.appendChild(source);

    const clone = source.cloneNode(true) as HTMLElement;
    // Wipe the clone's inline fonts so the assertion proves inlining did the
    // work, not cloneNode.
    clone.style.fontFamily = "";
    (clone.firstElementChild as HTMLElement).style.fontFamily = "";

    inlineResolvedFonts(source, clone);
    expect(clone.style.fontFamily).toContain("__Cinzel_test");
    expect((clone.firstElementChild as HTMLElement).style.fontFamily).toContain("__Mulish_test");

    document.body.removeChild(source);
  });
});

describe("buildSvgMarkup / toSvgDataUrl", () => {
  it("wraps the serialized node in a sized SVG with the font css inside", () => {
    const node = document.createElement("div");
    node.textContent = "TestMarker";
    const markup = buildSvgMarkup(node, "@font-face{/*css*/}", 1080, 1920);
    expect(markup).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">');
    expect(markup).toContain("<style>@font-face{/*css*/}</style>");
    expect(markup).toContain('<foreignObject x="0" y="0" width="1080" height="1920">');
    expect(markup).toContain("TestMarker");
    // XMLSerializer must stamp the XHTML namespace, or the markup is not
    // legal foreignObject content and renders blank.
    expect(markup).toContain('xmlns="http://www.w3.org/1999/xhtml"');
  });

  it("produces a data: URL — never blob:, which taints the canvas in Chromium", () => {
    const url = toSvgDataUrl("<svg>x</svg>");
    expect(url.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(url).not.toContain("blob:");
    expect(url).toContain(encodeURIComponent("<svg>x</svg>"));
  });
});

describe("CaptureError", () => {
  it("names its stage for the caller's busy/error pattern", () => {
    const e = new CaptureError("decode", "the serialized card did not decode");
    expect(e.stage).toBe("decode");
    expect(e.message).toContain("decode");
    expect(e.name).toBe("CaptureError");
  });
});
