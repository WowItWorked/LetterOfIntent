import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

/**
 * Copies pdf.js's worker into public/ before every build.
 *
 * The sample viewer loads the worker from a fixed path (`/pdf.worker.min.mjs`)
 * rather than letting the bundler resolve it — that keeps the URL predictable
 * and inside the CSP's `worker-src 'self'`. The cost of a fixed path is that
 * the copy can silently fall behind the installed pdfjs-dist, and pdf.js
 * refuses to run when the two versions disagree. Running this on prebuild
 * means they cannot.
 */

const require = createRequire(import.meta.url);
const pkg = require("pdfjs-dist/package.json");
const from = path.join(path.dirname(require.resolve("pdfjs-dist/package.json")), "build", "pdf.worker.min.mjs");
const to = path.resolve(process.cwd(), "public", "pdf.worker.min.mjs");

if (!fs.existsSync(from)) {
  console.error(`pdf.js worker not found at ${from}`);
  process.exit(1);
}

const incoming = fs.readFileSync(from);
const current = fs.existsSync(to) ? fs.readFileSync(to) : null;

if (current && current.equals(incoming)) {
  console.log(`pdf.js worker already current (pdfjs-dist ${pkg.version})`);
} else {
  fs.writeFileSync(to, incoming);
  console.log(`pdf.js worker synced from pdfjs-dist ${pkg.version}`);
}
