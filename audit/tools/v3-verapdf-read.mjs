// V3 — parse the shared veraPDF mrr XML reports and tabulate failures. READ-ONLY.
import fs from "node:fs";
import path from "node:path";
const dir = process.argv[2];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".xml"))) {
  const xml = fs.readFileSync(path.join(dir, f), "utf8");
  const compliant = /isCompliant="(\w+)"/.exec(xml)?.[1];
  const passed = /passedRules="(\d+)"/.exec(xml)?.[1];
  const failedRules = /failedRules="(\d+)"/.exec(xml)?.[1];
  const passedChecks = /passedChecks="(\d+)"/.exec(xml)?.[1];
  const failedChecks = /failedChecks="(\d+)"/.exec(xml)?.[1];
  const profile = /<profileName>([^<]*)<\/profileName>/.exec(xml)?.[1];
  const rules = [...xml.matchAll(/<rule[^>]*specification="([^"]*)"[^>]*clause="([^"]*)"[^>]*testNumber="(\d+)"[^>]*status="(\w+)"[^>]*failedChecks="(\d+)"/g)];
  console.log(`\n=== ${f} ===`);
  console.log(`  profile=${profile} compliant=${compliant} passedRules=${passed} failedRules=${failedRules} passedChecks=${passedChecks} failedChecks=${failedChecks}`);
  for (const r of rules) {
    if (r[4] !== "failed") continue;
    console.log(`  FAIL ${r[1]} ${r[2]}-${r[3]}  failedChecks=${r[5]}`);
  }
}
