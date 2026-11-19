import assert from "node:assert/strict";
import { test } from "node:test";
import G from "../../index.mjs";
import M from "../../src/math.mjs";
import R from "../../src/mgrs.mjs";
import U from "../../src/utmups.mjs";
import Utility from "../../src/utility.mjs";

test("C++ defaults are preserved when optional arguments are omitted", () => {
  assert.equal(U.standardZone(0, 3), 31);
  assert.equal(U.standardZone(85, 3, 0), 0);
  assert.equal(U.forward(83.5, 3, 0).zone, 0);
  assert.throws(() => U.forward(0, 3, 0));
  assert.equal(U.encodeZone(31, true), "31n");
  assert.deepEqual(R.reverse("31NEA"), R.reverse("31NEA", true));
  assert.deepEqual(G.toPoint("31NEA"), G.toPoint("31NEA", true));
  assert.equal(Utility.day(1), 1);
  assert.equal(Utility.set_digits(256), 53);
  assert.equal(Utility.lookupChar("ABCD", "b"), 1);
  assert.equal(R.latitudeBand(0), 0);
  assert.equal(R.approxLatitudeBand(-0), 0);
  assert.equal(U.centralMeridian(31), 3);
});

test("C++ output-reference adapters return objects and still update reference boxes", () => {
  const zone = {}, northp = {}, x = {}, y = {};
  assert.deepEqual(U.decodeZone("31n", zone, northp), { zone: 31, northp: true });
  assert.equal(zone.value, 31); assert.equal(northp.value, true);
  assert.deepEqual(U.decodeEPSG(32761, zone, northp), { zone: 0, northp: false });
  assert.equal(zone.value, 0); assert.equal(northp.value, false);
  assert.deepEqual(U.transfer(31, false, 500000, 10000000, 31, true, x, y, zone), { zone: 31, x: 500000, y: 0 });
  assert.equal(x.value, 500000); assert.equal(y.value, 0); assert.equal(zone.value, 31);
  const yy = {}, mm = {}, dd = {};
  assert.deepEqual(Utility.dateFromString("2026-11-19", yy, mm, dd), { y: 2026, m: 11, d: 19 });
  assert.deepEqual([yy.value, mm.value, dd.value], [2026, 11, 19]);
});

test("MGRS self-check executes its coverage checks", () => {
  const reverse = U.reverse;
  try {
    U.reverse = () => ({ lat: 0, lon: 1 });
    assert.throws(() => R.check(), /equator coverage failure/);
  } finally { U.reverse = reverse; }
  R.check();
});

test("invalid sentinel propagates NaNs through the convenience API", () => {
  assert.deepEqual(G.toPoint("INVALID"), [NaN, NaN]);
  assert.deepEqual(G.inverse("INVALID"), [NaN, NaN, NaN, NaN]);
});

test("coordinate checks retain C++ closed upper limits and throw by default", () => {
  assert.equal(U.checkCoords(true, true, 1000000, 9600000), true);
  assert.throws(() => U.checkCoords(true, true, 1000001, 0));
  assert.equal(U.checkCoords(true, true, 1000001, 0, false, false), false);
  assert.deepEqual(R.checkCoords(true, true, 500000, -1), { northp: false, x: 500000, y: 9999999 });
  assert.ok(R.checkCoords(true, true, 900000, 9500000).x < 900000);
  assert.deepEqual(M.angDiffWithError(0, -0), [-0, -0]);
});
