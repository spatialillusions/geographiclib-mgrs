import assert from "node:assert/strict";
import { evaluate } from "./cases.mjs";

export function compare(test) {
  let actual;
  try { actual = evaluate(test); }
  catch (error) {
    if (test.error) return;
    throw error;
  }
  assert.ok(!test.error, `C++ throws: ${test.error}`);
  assert.equal(actual.length, test.expected.length);
  actual.forEach((x, i) => {
    const y = test.expected[i];
    if (test.exact || typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || y === 0) {
      assert.ok(Object.is(x, y), `output ${i}: ${x} != ${y} (signed zeros checked)`);
    } else {
      // Projection arithmetic uses different JS/C++ libm implementations.
      // 20 nm for grid coordinates, 2e-12 degrees for angles, 2e-14 for scale.
      let absolute = 0, relative = 8e-15;
      if (["utmForward", "tmForward", "psForward", "transfer"].includes(test.op))
        absolute = i < (test.op === "utmForward" ? 4 : test.op === "transfer" ? 3 : 2) ? 2e-8 : i === actual.length - 1 ? 2e-14 : 2e-12;
      if (["utmReverse", "tmReverse", "psReverse", "toPoint"].includes(test.op)) absolute = i === 3 ? 2e-14 : 2e-12;
      if (test.op === "inverse") absolute = 2e-12;
      assert.ok(Math.abs(x - y) <= Math.max(absolute, relative * Math.abs(y)), `output ${i}: ${x} != ${y}`);
    }
  });
}
