/**
 * Minimal static server for the audit directory.
 *
 * Only exists because the in-app browser will not open file:// URLs. No
 * dependencies, no caching, and it serves audit/ ONLY — the dashboard is meant
 * to be a local artifact and this must not become a way to expose the repo.
 *
 *   node audit/tools/serve-audit.mjs [port]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.argv[2]) || 4321;
const ROOT = path.resolve("audit");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let rel = decodeURIComponent(url.pathname);
    if (rel === "/" || rel === "") rel = "/index.html";

    // Resolve, then confirm the result is still inside ROOT. Without this a
    // request for /../../.env would happily walk out of the audit directory.
    const target = path.resolve(ROOT, "." + rel);
    if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
      res.writeHead(403, { "content-type": "text/plain" });
      return res.end("Forbidden");
    }

    const s = await stat(target).catch(() => null);
    if (!s || !s.isFile()) {
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("Not found: " + rel);
    }

    const body = await readFile(target);
    res.writeHead(200, {
      "content-type": TYPES[path.extname(target).toLowerCase()] || "application/octet-stream",
      "content-length": body.length,
      "cache-control": "no-store",
    });
    res.end(body);
  } catch (e) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("Error: " + e.message);
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`audit dashboard -> http://localhost:${PORT}/`);
  console.log(`serving ${ROOT}`);
});
