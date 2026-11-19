const MATH = {
  // Constants defining the standard (Babylonian) meanings of degrees, minutes, and seconds, for angles.
  qd: 90, // degrees per quarter turn
  dm: 60, // minutes per degree
  ms: 60, // seconds per minute
  hd: 2 * 90, // degrees per half turn
  td: 2 * (2 * 90), // degrees per turn
  ds: 60 * 60, // seconds per degree

  // @return the number of bits of precision in a real number.
  digits() {
    return 53; // For double precision
  },

  // Set the binary precision of a real number.
  set_digits(ndigits) {
    // This only has an effect when using arbitrary precision libraries.
    return this.digits();
  },

  // @return the number of decimal digits of precision in a real number.
  digits10() {
    return 15; // For double precision
  },

  // Number of additional decimal digits of precision for real relative to double (0 for float).
  extra_digits() {
    return 0; // For double precision
  },

  // true if the machine is big-endian.
  bigendian: false,

  // @return π.
  pi() {
    return Math.PI;
  },

  // @return the number of radians in a degree.
  degree() {
    return Math.PI / (2 * 90);
  },

  // Square a number.
  sq(x) {
    return x * x;
  },

  // Normalize a two-vector.
  norm(x, y) {
    const h = Math.hypot(x, y);
    return [x / h, y / h];
  },

  // The error-free sum of two numbers.
  sum(u, v) {
    const s = u + v;
    const up = s - v;
    const vpp = s - up;
    const t = s !== 0 ? 0 - ((up - u) + (vpp - v)) : s;
    return [s, t];
  },

  // Evaluate a polynomial.
  polyval(N, p, x) {
    // This used to employ Math::fma; but that's too slow and it seemed not
    // to improve the accuracy noticeably.  This might change when there's
    // direct hardware support for fma.
    let y = N < 0 ? 0 : p[0];
    for (let i = 1; i <= N; ++i) {
      y = y * x + p[i];
    }
    return y;
  },

  // Normalize an angle.
  angNormalize(x) {
    const y = this.remainder(x, this.td);
    return Math.abs(y) === this.hd ? this.copysign(this.hd, x) : y;
  },

  // Normalize a latitude.
  latFix(x) {
    return Math.abs(x) > 90 ? NaN : x;
  },

  // The exact difference of two angles reduced to [-180°, 180°].
  angDiff(x, y) {
    return this.angDiffWithError(x, y)[0];
  },

  angDiffWithError(x, y) {
    let [d, e] = this.sum(this.remainder(-x, this.td), this.remainder(y, this.td));
    [d, e] = this.sum(this.remainder(d, this.td), e);
    if (d === 0 || Math.abs(d) === this.hd)
      d = this.copysign(d, e === 0 ? y - x : -e);
    return [d, e];
  },

  // IEEE remainder, with ties to an even quotient, as in C++ std::remainder.
  remainder(x, y) {
    let r = x % y;
    const h = Math.abs(y) / 2;
    if (Math.abs(r) > h ||
        (Math.abs(r) === h && Math.abs(x % (2 * y)) > h))
      r -= this.copysign(Math.abs(y), r);
    return r;
  },

  // Coarsen a value close to zero.
  angRound(x) {
    const z = 1 / 16;
    const y = Math.abs(x);
    const w = z - y;
    return this.copysign(w > 0 ? z - w : y, x);
  },

  // Evaluate the sine and cosine function with the argument in degrees.
  sincosd(x) {
    const d = this.remainder(x, this.qd);
    const q = Math.round(((x % this.td) - d) / this.qd);
    const r = d * this.degree();
    let s = Math.sin(r), c = Math.cos(r);
    if (2 * Math.abs(d) === this.qd) {
      c = Math.sqrt(1 / 2);
      s = this.copysign(c, r);
    } else if (3 * Math.abs(d) === this.qd) {
      c = Math.sqrt(3) / 2;
      s = this.copysign(1 / 2, r);
    }
    switch (q & 3) {
      case 1: [s, c] = [c, -s]; break;
      case 2: [s, c] = [-s, -c]; break;
      case 3: [s, c] = [-c, s]; break;
    }
    return [s === 0 ? this.copysign(s, x) : s, 0 + c];
  },

  // Evaluate the sine function with the argument in degrees.
  sind(x) {
    return this.sincosd(x)[0];
  },

  // Evaluate the cosine function with the argument in degrees.
  cosd(x) {
    return this.sincosd(x)[1];
  },

  // Evaluate the tangent function with the argument in degrees.
  tand(x) {
    const [s, c] = this.sincosd(x);
    const overflow = 1 / this.sq(Number.EPSILON);
    return Math.min(overflow, Math.max(-overflow, s / c));
  },

  // Evaluate the atan2 function with the result in degrees.
  atan2d(y, x) {
    // In order to minimize round-off errors, this function rearranges the
    // arguments so that result of atan2 is in the range [-pi/4, pi/4] before
    // converting it to degrees and mapping the result to the correct
    // quadrant.
    let q = 0;
    if (Math.abs(y) > Math.abs(x)) {
      [x, y] = [y, x];
      q = 2;
    }
    if (this.signbit(x)) {
      x = -x;
      ++q;
    }
    // here x >= 0 and x >= abs(y), so angle is in [-pi/4, pi/4]
    let ang = (Math.atan2(y, x) / this.pi()) * this.hd;
    switch (q) {
      case 1:
        ang = this.copysign(this.hd, y) - ang;
        break;
      case 2:
        ang = this.qd - ang;
        break;
      case 3:
        ang = -this.qd + ang;
        break;
      default:
        break;
    }
    return ang;
    //return Math.atan2(y, x) / this.degree();
  },

  // Evaluate the atan function with the result in degrees.
  atand(x) {
    return this.atan2d(x, 1);
    //return Math.atan(x) / this.degree();
  },

  // Evaluate e atanh(e x)
  eatanhe(x, es) {
    return es > 0 ? es * Math.atanh(es * x) : -es * Math.atan(es * x);
  },

  // tanχ in terms of tanφ
  taupf(tau, es) {
    if (!Number.isFinite(tau)) return tau;
    const tau1 = Math.hypot(1, tau);
    const sig = Math.sinh(this.eatanhe(tau / tau1, es));
    return Math.hypot(1, sig) * tau - sig * tau1;
  },

  // tanφ in terms of tanχ
  tauf(taup, es) {
    const numit = 5;
    // min iterations = 1, max iterations = 2; mean = 1.95
    const tol = Math.sqrt(Number.EPSILON) / 10;
    const taumax = 2 / Math.sqrt(Number.EPSILON);
    const e2m = 1 - es * es;

    // To lowest order in e^2, taup = (1 - e^2) * tau = _e2m * tau; so use
    // tau = taup/e2m as a starting guess. Only 1 iteration is needed for
    // |lat| < 3.35 deg, otherwise 2 iterations are needed.  If, instead, tau
    // = taup is used the mean number of iterations increases to 1.999 (2
    // iterations are needed except near tau = 0).
    //
    // For large tau, taup = exp(-es*atanh(es)) * tau.  Use this as for the
    // initial guess for |taup| > 70 (approx |phi| > 89deg).  Then for
    // sufficiently large tau (such that sqrt(1+tau^2) = |tau|), we can exit
    // with the initial guess and avoid overflow problems.  This also reduces
    // the mean number of iterations slightly from 1.963 to 1.954.
    let tau =
      Math.abs(taup) > 70 ? taup * Math.exp(this.eatanhe(1, es)) : taup / e2m;
    const stol = tol * Math.max(1, Math.abs(taup));

    if (!(Math.abs(tau) < taumax)) {
      return tau; // handles +/-Infinity and NaN
    }

    for (let i = 0; i < numit; ++i) {
      const taupa = this.taupf(tau, es);
      const dtau =
        ((taup - taupa) * (1 + e2m * tau * tau)) /
        (e2m * Math.hypot(1, tau) * Math.hypot(1, taupa));
      tau += dtau;
      if (!(Math.abs(dtau) >= stol)) {
        break;
      }
    }

    return tau;
  },
  // Implement hypot with 3 parameters
  hypot3(x, y, z) {
    return Math.hypot(x, Math.hypot(y, z));
  },

  // The NaN (not a number)
  NaN() {
    return NaN;
  },

  // Infinity
  infinity() {
    return Infinity;
  },

  // Swap the bytes of a quantity
  swab(x) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat64(0, x, true);
    const swapped = new DataView(buffer);
    return swapped.getFloat64(0, false);
  },

  signbit(x) {
    return x === 0 ? 1 / x === -Infinity : x < 0;
  },

  copysign(x, y) {
    return Math.abs(x) * (this.signbit(y) ? -1 : 1);
  },
};

export default MATH;
