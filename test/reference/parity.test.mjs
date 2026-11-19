import fs from "node:fs";
import { test } from "node:test";
import { decode, encode } from "./cases.mjs";
import { compare } from "./compare.mjs";

const corpus = JSON.parse(fs.readFileSync(new URL("./fixtures.json", import.meta.url), "utf8"), decode);
const groups = new Map();
for (const item of corpus.tests) {
  if (!groups.has(item.op)) groups.set(item.op, []);
  groups.get(item.op).push(item);
}
for (const [op, cases] of groups) {
  test(`${op}: ${cases.length} comparisons with C++`, () => {
    for (const item of cases) {
      try { compare(item); }
      catch (error) { error.message = JSON.stringify(item, encode) + ": " + error.message; throw error; }
    }
  });
}
