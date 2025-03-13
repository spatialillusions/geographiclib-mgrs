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
    return ndigits;
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
    const t = u - up + (v - vpp);
    return [s, t];
  },

  // Evaluate a polynomial.
  polyval(N, p, x) {
    let y = N < 0 ? 0 : p[0];
    for (let i = 1; i <= N; ++i) {
      y = y * x + p[i];
    }
    return y;
  },

  // Normalize an angle.
  AngNormalize(x) {
    x = x % 360;
    return x <= -180 ? x + 360 : x > 180 ? x - 360 : x;
  },

  // Normalize a latitude.
  LatFix(x) {
    return Math.abs(x) > 90 ? NaN : x;
  },

  // The exact difference of two angles reduced to [-180°, 180°].
  AngDiff(x, y) {
    const d = y - x;
    return this.AngNormalize(d);
  },

  // Coarsen a value close to zero.
  AngRound(x) {
    const z = 1 / 16;
    return Math.abs(x) < z ? 0 : x;
  },

  // Evaluate the sine and cosine function with the argument in degrees.
  sincosd(x) {
    const r = x * this.degree();
    //slam = math.sin(math.radians(lon))
    //clam = math.cos(math.radians(lon))
    return [Math.sin(r), Math.cos(r)];
  },

  // Evaluate the sine function with the argument in degrees.
  sind(x) {
    return Math.sin(x * this.degree());
  },

  // Evaluate the cosine function with the argument in degrees.
  cosd(x) {
    return Math.cos(x * this.degree());
  },

  // Evaluate the tangent function with the argument in degrees.
  tand(x) {
    return Math.tan(x * this.degree());
  },

  // Evaluate the atan2 function with the result in degrees.
  atan2d(y, x) {
    return Math.atan2(y, x) / this.degree();
  },

  // Evaluate the atan function with the result in degrees.
  atand(x) {
    return Math.atan(x) / this.degree();
  },

  // Evaluate e atanh(e x)
  eatanhe(x, es) {
    return es > 0 ? es * Math.atanh(es * x) : -es * Math.atan(-es * x);
  },

  // tanχ in terms of tanφ
  taupf(tau, es) {
    const tau1 = Math.hypot(1, tau);
    const sig = Math.sinh(this.eatanhe(tau / tau1, es));
    return Math.hypot(1, sig) * tau - sig * tau1;
  },

  // tanφ in terms of tanχ
  tauf(taup, es) {
    const tau1 = Math.hypot(1, taup);
    const sig = Math.sinh(this.eatanhe(taup / tau1, es));
    return Math.hypot(1, sig) * taup + sig * tau1;
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
    return Math.sign(x) === -1;
  },
};

export default MATH;
