import MATH from "./math.mjs";

const UTILITY = {
  day(y, m, d) {
    // Convert from date to sequential day and vice versa
    const greg = this.gregorian(y, m, d);
    y += Math.floor((m + 9) / 12) - 1; // Move Jan and Feb to previous year,
    m = (m + 9) % 12; // making March month 0.
    return (
      Math.floor((1461 * y) / 4) + // Julian years converted to days.  Julian year is 365 + 1/4 = 1461/4 days.
      (greg ? Math.floor(y / 100) / 4 - Math.floor(y / 100) + 2 : 0) + // Gregorian leap year corrections.
      Math.floor((153 * m + 2) / 5) + // The zero-based start of the m'th month
      d -
      1 - // The zero-based day
      305 // The number of days between March 1 and December 31.
    ); // This makes 0001-01-01 day 1
  },

  dayWithCheck(y, m, d, check) {
    const s = this.day(y, m, d);
    if (!check) return s;
    let { y1, m1, d1 } = this.date(s);
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
    y.value = Math.floor((4 * s + 3) / 1461); // Determine the year using Julian rules.
    s -= Math.floor((1461 * y.value) / 4); // s = 0 at start of year, i.e., March 1
    y.value += c * 100; // Assemble full year
    m.value = Math.floor((5 * s + 2) / 153); // Determine the month
    s -= Math.floor((153 * m.value + 2) / 5); // s = 0 at beginning of month
    d.value = s + 1; // Determine day of month
    y.value += Math.floor((m.value + 2) / 12); // Move Jan and Feb back to original year
    m.value = ((m.value + 2) % 12) + 1; // Renumber the months so January = 1

    return { y: y.value, m: m.value, d: d.value };
  },

  dateFromString(s, y, m, d) {
    if (s === "now") {
      const now = new Date();
      y.value = now.getUTCFullYear();
      m.value = now.getUTCMonth() + 1;
      d.value = now.getUTCDate();
      return;
    }
    let y1,
      m1 = 1,
      d1 = 1;
    const p1 = s.search(/[^0-9]/);
    if (p1 === -1) y1 = parseInt(s);
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
        d1 = parseInt(s.substring(p1 + p2));
      }
    }
    y.value = y1;
    m.value = m1;
    d.value = d1;
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

  ParseLine(line, key, value, equals, comment) {
    key.value = "";
    value.value = "";
    const n = comment ? line.indexOf(comment) : line.length;
    const linea = this.trim(line.substring(0, n));
    if (linea === "") return false;
    const eqPos = equals ? linea.indexOf(equals) : linea.search(/\s/);
    key.value = this.trim(linea.substring(0, eqPos));
    if (key.value === "") return false;
    if (eqPos !== -1) value.value = this.trim(linea.substring(eqPos + 1));
    return true;
  },

  set_digits(ndigits) {
    if (ndigits <= 0) {
      const digitenv = process.env.GEOGRAPHICLIB_DIGITS;
      if (digitenv) ndigits = parseInt(digitenv);
      if (ndigits <= 0) ndigits = 256;
    }
    return MATH.set_digits(ndigits);
  },

  gregorian(y, m, d) {
    // Determine if the date is in the Gregorian calendar
    return y > 1582 || (y === 1582 && (m > 10 || (m === 10 && d >= 15)));
  },

  /**
   * Convert a number to a string.
   *
   * @param {number} x - The value to be converted.
   * @param {number} [p=-1] - The precision used.
   * @returns {string} The string representation.
   */
  str(x, p = -1) {
    if (!isFinite(x)) {
      return x < 0 ? "-inf" : x > 0 ? "inf" : "nan";
    }
    if (p >= 0) {
      return x.toFixed(p);
    }
    return x.toString();
  },
  /*
  str(x) {
    return x.toString();
  },*/
};

export default UTILITY;
