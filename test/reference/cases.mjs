import fs from "node:fs";
import G from "../../index.mjs";
import M from "../../src/math.mjs";
import C from "../../src/constants.mjs";
import U from "../../src/utmups.mjs";
import R from "../../src/mgrs.mjs";
import T from "../../src/transverse-mercator.mjs";
import P from "../../src/polar-stereographic.mjs";
import Utility from "../../src/utility.mjs";
import Complex from "../../src/complex.mjs";
import { upstreamCases } from "./upstream-cases.mjs";

export const encode = (_, x) => typeof x === "number" ?
  Number.isNaN(x) ? "~nan" : x === Infinity ? "~inf" : x === -Infinity ? "~-inf" : Object.is(x, -0) ? "~-0" : x : x;
export const decode = (_, x) => x === "~nan" ? NaN : x === "~inf" ? Infinity : x === "~-inf" ? -Infinity : x === "~-0" ? -0 : x;
const values = x => x === undefined ? [] : Array.isArray(x) ? x : typeof x === "object" ? Object.values(x) : [x];
export function evaluate({ op, args: a }) {
  switch (op) {
    case "forward": return [G.forward([a[1], a[0]], a[4])];
    case "toPoint": return G.toPoint(...a);
    case "inverse": return G.inverse(...a);
    case "utmForward": return values(U.forward(...a));
    case "utmReverse": return values(U.reverse(...a));
    case "mgrsForward": return [R.forward(...a)];
    case "mgrsForwardLat": return [R.forwardKnowLattitude(...a)];
    case "mgrsReverse": return values(R.reverse(...a));
    case "decode": return values(R.decode(...a));
    case "check": return values(R.check());
    case "zone": return [U.standardZone(...a)];
    case "decodeZone": case "encodeZone": case "decodeEPSG": case "encodeEPSG": case "transfer": return values(U[op](...a));
    case "tmForward": case "tmReverse": case "tmInit": {
      const tm = Object.create(T); tm.init(...a.slice(0, 3));
      return op === "tmInit" ? [] : values(tm[op === "tmForward" ? "forward" : "reverse"](...a.slice(3)));
    }
    case "psForward": case "psReverse": case "psScale": case "psInit": {
      const ps = Object.create(P); ps.init(...a.slice(0, 3));
      if (op === "psInit") return [];
      if (op === "psScale") { ps.setScale(...a.slice(3)); return [ps.forward(true, a[3], 0).k]; }
      return values(ps[op === "psForward" ? "forward" : "reverse"](...a.slice(3)));
    }
    case "angDiff": return M.angDiffWithError(...a);
    case "angDiffPrincipal": return [M.angDiff(...a)];
    case "day": return [Utility.dayWithCheck(...a)];
    case "date": case "dateFromString": case "trim": case "lookup": case "str": return values(Utility[op](...a));
    case "parseLine": {
      const key = {}, val = {};
      return [Utility.parseLine(a[0], key, val, a[1], a[2]), key.value, val.value];
    }
    case "complex": {
      const z = new Complex(a[0], a[1]), r = new Complex(a[2], a[3]);
      return values(z[a[4]](r));
    }
    case "constants": return Object.values(C).map(fn => fn.call(C));
    case "utmConstants": return [U.equatorialRadius(), U.flattening(), U.UTMShift()];
    case "mathConstants": return [M.digits(), M.digits10(), M.extra_digits(), M.bigendian, M.pi(), M.degree(), M.NaN(), M.infinity()];
    case "polyval": return [M.polyval(a[0], [1, 2, 3, 4], a[1])];
    default: return values(M[op](...a));
  }
}

export function cases(full = false) {
  const all = [];
  const add = (op, ...args) => all.push({ op, args });
  const f = C.WGS84_f(), tm = [6378137, f, 0.9996], ps = [6378137, f, 0.994];
  const angles = [0, -0, 1e-200, -1e-200, 0.01, -0.01, 30, -30, 45, -45, 60, 90, -90, 135, 180, -180, 270, -270, 360, -360, 540, -540, 1e20, NaN, Infinity, -Infinity];
  add("constants"); add("mathConstants"); add("utmConstants"); add("check");
  for (const x of [0, -0, 1, -1, 1e200, Infinity, NaN]) { add("sq", x); add("swab", x); }
  for (const x of [0, -0, 3, 1e200, Infinity, NaN]) for (const y of [0, -0, 4, 1e200, Infinity, NaN]) add("norm", x, y);
  for (const n of [-1, 0, 1, 2, 3]) add("polyval", n, 2);
  for (const x of angles) {
    for (const op of ["angNormalize", "angRound", "latFix", "sincosd", "sind", "cosd", "tand", "atand", "signbit"]) add(op, x);
    for (const y of [0, -0, 1, -1, 180, -180, Infinity, -Infinity, NaN]) {
      for (const op of ["atan2d", "copysign", "angDiff", "sum"]) add(op, x, y);
    }
  }
  for (const x of angles.slice(0, 24)) add("remainder", x, 90);
  for (const es of [0, 0.0818191908426215, -0.2]) {
    for (const tau of [0, -0, 0.01, -1, 70, 100, 1e100, Infinity, -Infinity, NaN]) {
      add("taupf", tau, es); add("tauf", tau, es);
    }
    for (const x of [-1, -0, 0, 0.3, 1]) add("eatanhe", x, es);
  }
  add("hypot3", 3, 4, 12); add("set_digits", 256);
  for (const prec of [8, 9]) add("mgrsForward", 38, true, 500000, 63.811, prec);
  add("mgrsForward", 38, true, 444140.6, 3684706.3, 8);
  for (const prec of [-1, 0, 1]) add("mgrsForward", 0, false, 2746000, 1515000, prec);
  for (const lat of [NaN, 0, 10]) for (const x of [NaN, 500000]) add("mgrsForwardLat", 31, true, x, 0, lat, 5);
  for (const zone of [0, 31]) for (const northp of [false, true])
    for (const x of [0, 99999, 100000, 500000, 900000, 1000000, 2000000, 2700000])
      for (const y of [-9000000, 0, 2000000, 9500000, 10000000, 19500000]) add("utmReverse", zone, northp, x, y, true);
  for (const lat of [-91, -90, -85, -80, -79.999999, -72, -64, -56, -8, -1e-14, -0, 0, 1e-14, 8, 56, 64, 72, 83.999999, 84, 85, 90, 91, NaN]) {
    for (const lon of [-180, -177, -0, 0, 3, 9, 21, 33, 42, 177, 180]) {
      add("zone", lat, lon, -1);
      add("utmForward", lat, lon, -1, false);
      add("forward", lat, lon, -1, false, 5);
    }
  }
  for (const lat of [-90, -80, -0, 0, 45, 84, 90, NaN]) {
    for (const lon of [-180, -90, -0, 0, 90, 180, NaN]) {
      add("tmForward", ...tm, 0, lat, lon);
      for (const northp of [false, true]) add("psForward", ...ps, northp, lat, lon);
    }
    for (const zone of [-5, -4, -3, -2, -1, 0, 1, 31, 60, 61]) add("utmForward", lat, 3, zone, false);
  }
  for (const x of [-0, 0, 100000, 500000]) for (const y of [-10000000, -0, 0, 10000000, 20000000]) add("tmReverse", ...tm, 0, x, y);
  for (const northp of [false, true]) {
    for (const x of [-0, 0, 100000]) for (const y of [-100000, -0, 0, 100000]) add("psReverse", ...ps, northp, x, y);
    for (const zone of [0, 1, 31, 60, -4, -1, 61]) {
      add("encodeEPSG", zone, northp);
      for (const abbrev of [false, true]) add("encodeZone", zone, northp, abbrev);
      for (const x of [0, 100000, 500000, 900000, 1000000, 2000000, NaN]) {
        for (const y of [-9000000, 0, 9500000, 10000000, 19500000, 2000000, NaN]) add("utmReverse", zone, northp, x, y, false);
      }
    }
    for (const zoneout of [-4, -3, -2, -1, 0, 31, 32, 61]) {
      add("transfer", 31, northp, 500000, northp ? 0 : 10000000, zoneout, true);
      add("transfer", 0, northp, 2000000, 2000000, zoneout, !northp);
    }
  }
  for (const epsg of [0, 32600, 32601, 32631, 32660, 32661, 32662, 32701, 32760, 32761, 32762, 4326]) add("decodeEPSG", epsg);
  for (const zone of ["n", "s", "north", "SOUTH", "1n", "01n", "60south", "inv", "INVALID", "0n", "61n", "001n", "+1n", "-1s", "", "1", "foo", " 1n"]) add("decodeZone", zone);
  for (const ref of ["ZAJ0000011026", "BAL0000088973", "YZA", "ZAH", "BAN", "31NAA", "31V", "38VLS", "38WLS", "38VMS", "38MPE", "38NPF", "38NPE", "38MPF", "ZAB", "YZB", "YAB", "ZZB", "33VVE7220287839", "33vve7220287839", "inv", "invalid", "A", "Y", "Z", "31N", "31NIJ", "31NOA", "123N", "0N", "31NAA1", "31NAA12x4", "31NAA" + "1".repeat(24), "", "123"]) {
    add("decode", ref);
    add("inverse", ref);
    for (const center of [false, true]) { add("mgrsReverse", ref, center); add("toPoint", ref, center); }
  }
  for (const northp of [false, true]) for (const zone of [0, 31]) {
    for (const x of [100000, 500000, 900000, 1300000, 2000000, 2700000, 3200000]) {
      for (const y of [-9000000, -1, 0, 2000000, 9500000, 10000000, 10000001, 19500000]) {
        for (const prec of [-2, -1, 0, 5, 11, 12]) add("mgrsForward", zone, northp, x, y, prec);
      }
    }
  }
  for (const prec of [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    add("mgrsForwardLat", 31, false, 500000, 10000000, -0, prec);
    add("mgrsForwardLat", 31, true, 500000.123456, 1234567.891234, 11.168, prec);
  }
  for (const params of [[0, f, 1], [NaN, f, 1], [6378137, 1, 1], [6378137, f, 0], [6378137, -0.2, 1], [6378137, 0, 1]]) {
    add("tmInit", ...params); add("psInit", ...params);
    add("tmForward", ...params, 0, 35, 20); add("psForward", ...params, true, 85, 45);
  }
  for (const lat of [-90, -45, 0, 45, 90, 91, NaN]) for (const k of [0, 0.9, 1, Infinity]) add("psScale", ...ps, lat, k);
  for (const date of [[1,1,1], [1582,10,15], [1752,9,2], [1752,9,3], [1752,9,14], [1900,2,29], [2000,2,29], [2026,11,19], [2026,13,1]]) {
    add("day", ...date, false); add("day", ...date, true);
  }
  for (const day of [1, 577738, 639798, 639799, 730181, 739951]) add("date", day);
  for (const date of ["", "2026", "2026-11", "2026-11-19", "2026-1-", "2026-1-2x", "-1", "2026--1"]) add("dateFromString", date);
  for (const line of ["", "  ", "key", "a=b", " = value", "key=value #comment", "key # comment", "key\tvalue", "key=value\n"]) for (const eq of ["", "="]) add("parseLine", line, eq, "#");
  add("trim", "  text  "); add("lookup", "ABCD", "b"); add("lookup", "ABCD", "x");
  for (const op of ["add", "sub", "mul", "div", "abs"]) add("complex", 3, 4, 2, -1, op);
  for (const magnitude of [1e200, 1e-200]) add("complex", magnitude, magnitude, magnitude, -magnitude, "div");
  for (const a of [0, -0, 1, Infinity, NaN]) for (const b of [0, -0, -1, -Infinity])
    for (const c of [0, -0, 1, Infinity]) for (const d of [0, -0, -1, NaN])
      for (const op of ["mul", "div"]) add("complex", a, b, c, d, op);
  for (const x of [0, -0, 1.23456789, 1e-5, 1e10, 1e21, 1e-300, Number.MIN_VALUE, 2.5, 3.5, -2.5, 9.999995, 99.99995, 999999.5, NaN, Infinity]) for (const p of [-1, 0, 3]) add("str", x, p);
  let seed = 42;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  for (let n = 0; n < (full ? 20000 : 100); ++n) {
    const lat = random() * 180 - 90, lon = random() * 720 - 360;
    add("forward", lat, lon, -1, false, n % 7 - 1);
    add("utmForward", lat, lon, -1, false);
  }
  if (full) {
    // Exhaust every UTM 100 km block/band combination, including illegal ones.
    for (let zone = 1; zone <= 60; ++zone) for (const band of R.latband_) for (const col of R.utmcols_[(zone - 1) % 3]) for (const row of R.utmrow_)
      add("mgrsReverse", String(zone) + band + col + row, false);
    for (let band = 0; band < 4; ++band) for (const col of R.upscols_[band]) for (const row of R.upsrows_[band >= 2 ? 1 : 0])
      add("mgrsReverse", R.upsband_[band] + col + row, false);
    for (const row of fs.readFileSync(new URL("../geotrans3.9-output/geoToMgrs_WE.txt", import.meta.url), "utf8").split(/\r?\n/).slice(3).map(s => s.split("\t"))) {
      if (row[10]) add("forward", Number(row[7]), Number(row[8]), -1, false, 5);
    }
    for (const row of fs.readFileSync(new URL("../geotrans3.9-output/mgrsToGeo_WE.txt", import.meta.url), "utf8").split(/\r?\n/).slice(3).map(s => s.split("\t"))) {
      if (row[7]) add("toPoint", row[7].trim(), false);
    }
  }
  return [...all, ...upstreamCases()];
}
