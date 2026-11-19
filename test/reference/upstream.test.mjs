import assert from "node:assert/strict";
import { test } from "node:test";
import M from "../../src/math.mjs";
import U from "../../src/utmups.mjs";
import T from "../../src/transverse-mercator.mjs";
import { upstreamCases } from "./upstream-cases.mjs";
import { compare } from "./compare.mjs";

// Retain upstream's literal expectations independently of generated fixtures.
const groups = new Map();
for (const item of upstreamCases().filter(item => item.expected)) {
  if (!groups.has(item.source)) groups.set(item.source, []);
  groups.get(item.source).push(item);
}
for (const [source, cases] of groups) {
  test(`upstream ${source}: ${cases.length} literal checks`, () => {
    for (const item of cases) compare(item);
  });
}

test("upstream signtest.cpp: sincosd complementary and large-angle identities", () => {
  const [s1,c1] = M.sincosd(9), [s2,c2] = M.sincosd(81), [s3,c3] = M.sincosd(-123456789);
  assert.ok(Object.is(s1,c2)); assert.ok(Object.is(c1,s2));
  assert.ok(Object.is(s1,s3)); assert.ok(Object.is(c1,-c3));
});

test("upstream signtest.cpp: atan2d accuracy near the antimeridian", () => {
  const s = 7e-16;
  assert.equal(M.atan2d(s,-1), 180-M.atan2d(s,1));
});

test("upstream CMakeLists.txt: projection output regressions", () => {
  // Match upstream's published decimal precision in addition to oracle values.
  const ps = U.forward(86,0);
  assert.equal(ps.zone,0); assert.equal(ps.x,2000000);
  assert.equal(ps.y.toFixed(6),"1555731.570643");
  const tm = Object.create(T); tm.init(6400000,1/150,0.9996);
  const projected = tm.forward(0,20,30);
  assert.equal(projected.x.toFixed(6),"3266035.453860");
  assert.equal(projected.y.toFixed(6),"2518371.552676");
  assert.equal(projected.gamma.toFixed(12),"11.207356502141");
  assert.equal(projected.k.toFixed(12),"1.134138960741");
  const reversed = tm.reverse(0,3300000,2500000);
  assert.equal(reversed.lat.toFixed(11),"19.80370996793");
  assert.equal(reversed.lon.toFixed(11),"30.24919702282");
  assert.equal(reversed.gamma.toFixed(12),"11.214378172893");
  assert.equal(reversed.k.toFixed(12),"1.137025775759");
});
