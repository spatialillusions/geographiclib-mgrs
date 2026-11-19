import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { cases, encode } from "./cases.mjs";
import { compare } from "./compare.mjs";

// node test/reference/generate.mjs [--full] [--wsl] /path/to/oracle
const full = process.argv.includes("--full"), wsl = process.argv.includes("--wsl");
const executable = process.argv.slice(2).find(a => !a.startsWith("--"));
if (!executable) throw new Error("Supply the compiled C++ oracle executable path");
const tests = cases(full);
const input = tests.map(({ op, args }) => op + " " + args.map(x => {
  const s = typeof x === "number" ? Object.is(x, -0) ? "-0" : Number.isNaN(x) ? "nan" : x === Infinity ? "inf" : x === -Infinity ? "-inf" : String(x) : String(x);
  return Buffer.from(s).toString("hex") || "-";
}).join(" ")).join("\n") + "\n";
const result = spawnSync(wsl ? "wsl.exe" : executable, wsl ? ["--exec", executable] : [], { input, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
if (result.error || result.status !== 0) throw result.error || new Error(result.stderr);
const lines = result.stdout.trim().split(/\r?\n/);
if (lines.length !== tests.length) throw new Error(`Oracle returned ${lines.length} lines for ${tests.length} cases`);
const { decode } = await import("./cases.mjs");
let failures = 0;
for (let n = 0; n < tests.length; ++n) {
  const expected = JSON.parse(lines[n], decode);
  if (expected.error) tests[n].error = expected.error;
  else tests[n].expected = expected;
  try { compare(tests[n]); }
  catch (error) { if (failures++ < 25) console.error(JSON.stringify(tests[n], encode), error.message); }
}
console.log(`${tests.length} C++ comparisons, ${failures} failures`);
if (failures) process.exitCode = 1;
else if (!full) fs.writeFileSync(new URL("./fixtures.json", import.meta.url),
  '{\n  "upstream": "geographiclib/geographiclib@48959dfc4a581ad29f76b526726a801473767c98",\n  "tests": [\n' +
  tests.map(item => "    " + JSON.stringify(item, encode)).join(",\n") + "\n  ]\n}\n");
