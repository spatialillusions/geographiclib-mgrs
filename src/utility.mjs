import MATH from "./math.mjs";

// Round the exact binary64 value to a decimal integer, ties to even, as an
// iostream does. toFixed rounds halfway cases away from zero instead.
function decimalInteger(x, places) {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, Math.abs(x));
  const bits = view.getBigUint64(0);
  const exponent = Number((bits >> 52n) & 2047n);
  let n = bits & ((1n << 52n) - 1n), d = 1n;
  if (exponent !== 0) n += 1n << 52n;
  const shift = exponent === 0 ? -1074 : exponent - 1023 - 52;
  if (shift >= 0) n <<= BigInt(shift);
  else d <<= BigInt(-shift);
  if (places >= 0) n *= 10n ** BigInt(places);
  else d *= 10n ** BigInt(-places);
  const q = n / d, r = n % d;
  return q + (2n * r > d || (2n * r === d && q % 2n !== 0n) ? 1n : 0n);
}

const UTILITY = {
  day(y, m = 1, d = 1) {
    // Convert from date to sequential day and vice versa
    const greg = this.gregorian(y, m, d);
    y += Math.floor((m + 9) / 12) - 1; // Move Jan and Feb to previous year,
    m = (m + 9) % 12; // making March month 0.
    return (
      Math.floor((1461 * y) / 4) + // Julian years converted to days.  Julian year is 365 + 1/4 = 1461/4 days.
      (greg ? Math.floor(Math.floor(y / 100) / 4) - Math.floor(y / 100) + 2 : 0) + // Gregorian leap year corrections.
      Math.floor((153 * m + 2) / 5) + // The zero-based start of the m'th month
      d -
      1 - // The zero-based day
      305 // The number of days between March 1 and December 31.
    ); // This makes 0001-01-01 day 1
  },

  dayWithCheck(y, m, d, check) {
    const s = this.day(y, m, d);
    if (!check) return s;
    const { y: y1, m: m1, d: d1 } = this.date(s);
    if (!(s > 0 && y === y1 && m === m1 && d === d1))
      throw new Error(
        "Invalid date " +
          this.str(y) +
          "-" +
          this.str(m) +
          "-" +
          this.str(d) +
          (s > 0
            ? "; use " + this.str(y1) + "-" + this.str(m1) + "-" + this.str(d1)
            : " before 0001-01-01"),
      );
    return s;
  },

  date(s) {
    let c = 0;
    const greg = this.gregorian(s);
    s += 305; // s = 0 on March 1, 1BC
    if (greg) {
      s -= 2; // The 2 day Gregorian offset
      c = Math.floor((4 * s + 3) / 146097); // Determine century with the Gregorian rules for leap years.
      s -= Math.floor((c * 146097) / 4); // s = 0 at beginning of century
    }
    let y = Math.floor((4 * s + 3) / 1461);
    s -= Math.floor((1461 * y) / 4);
    y += c * 100;
    let m = Math.floor((5 * s + 2) / 153);
    s -= Math.floor((153 * m + 2) / 5);
    const d = s + 1;
    y += Math.floor((m + 2) / 12);
    m = ((m + 2) % 12) + 1;
    return { y, m, d };
  },

  dateFromString(s, y = {}, m = {}, d = {}) {
    if (s === "now") {
      const now = new Date();
      y.value = now.getUTCFullYear();
      m.value = now.getUTCMonth() + 1;
      d.value = now.getUTCDate();
      return { y: y.value, m: m.value, d: d.value };
    }
    let y1,
      m1 = 1,
      d1 = 1;
    let p1 = s.search(/[^0-9]/);
    if (p1 === -1) {
      if (s.length === 0) throw new Error("Empty date");
      y1 = parseInt(s);
    }
    else if (s[p1] !== "-")
      throw new Error("Delimiter not hyphen in date " + s);
    else if (p1 === 0) throw new Error("Empty year field in date " + s);
    else {
      y1 = parseInt(s.substring(0, p1));
      if (++p1 === s.length) throw new Error("Empty month field in date " + s);
      const p2 = s.substring(p1).search(/[^0-9]/);
      if (p2 === -1) m1 = parseInt(s.substring(p1));
      else if (s[p2 + p1] !== "-")
        throw new Error("Delimiter not hyphen in date " + s);
      else if (p2 === 0) throw new Error("Empty month field in date " + s);
      else {
        m1 = parseInt(s.substring(p1, p1 + p2));
        if (++p1 + p2 === s.length)
          throw new Error("Empty day field in date " + s);
        const day = s.substring(p1 + p2);
        if (!/^\d+\s*$/.test(day)) throw new Error("Invalid day in date " + s);
        d1 = Number(day);
      }
    }
    y.value = y1;
    m.value = m1;
    d.value = d1;
    return { y: y1, m: m1, d: d1 };
  },

  trim(s) {
    let beg = 0,
      end = s.length;
    while (beg < end && /\s/.test(s[beg])) ++beg;
    while (beg < end && /\s/.test(s[end - 1])) --end;
    return s.substring(beg, end);
  },

  lookup(s, c) {
    const r = s.indexOf(c.toUpperCase());
    return r === -1 ? -1 : r;
  },

  lookupChar(s, c) {
    const p = s.indexOf(c.toUpperCase());
    return p !== -1 ? p : -1;
  },

  parseLine(line, key, value, equals, comment) {
    key.value = "";
    value.value = "";
    const pos = comment ? line.indexOf(comment) : -1;
    const n = pos < 0 ? line.length : pos;
    const linea = this.trim(line.substring(0, n));
    if (linea === "") return false;
    const eqPos = equals ? linea.indexOf(equals) : linea.search(/\s/);
    key.value = this.trim(linea.substring(0, eqPos < 0 ? linea.length : eqPos));
    if (key.value === "") return false;
    if (eqPos !== -1) value.value = this.trim(linea.substring(eqPos + 1));
    return true;
  },

  set_digits(ndigits) {
    return MATH.set_digits(ndigits);
  },

  gregorian(y, m, d) {
    // Determine if the date is in the Gregorian calendar
    return m === undefined ? y >= 639799 : 100 * (100 * y + m) + d >= 17520914;
  },

  /**
   * Convert a number to a string.
   *
   * @param {number} x - The value to be converted.
   * @param {number} [p=-1] - The precision used.
   * @returns {string} The string representation.
   */
  str(x, p = -1) {
    if (typeof x !== "number") return String(x);
    if (!isFinite(x)) {
      return x < 0 ? "-inf" : x > 0 ? "inf" : "nan";
    }
    const sign = MATH.signbit(x) ? "-" : "";
    if (p >= 0) {
      const digits = decimalInteger(x, p).toString().padStart(p + 1, "0");
      return sign + (p ? digits.slice(0, -p) + "." + digits.slice(-p) : digits);
    }
    if (x === 0) return sign + "0";
    let exponent = Number(Math.abs(x).toExponential().split("e")[1]);
    let digits = decimalInteger(x, 5 - exponent).toString();
    if (digits.length > 6) { digits = digits.slice(0, -1); ++exponent; }
    if (exponent < -4 || exponent >= 6) {
      const fraction = digits.slice(1).replace(/0+$/, "");
      return sign + digits[0] + (fraction ? "." + fraction : "") +
        "e" + (exponent < 0 ? "-" : "+") + String(Math.abs(exponent)).padStart(2, "0");
    }
    const places = 5 - exponent;
    digits = digits.padStart(places + 1, "0");
    return sign + (places ? (digits.slice(0, -places) + "." + digits.slice(-places)).replace(/\.?0+$/, "") : digits);
  },
};

export default UTILITY;
