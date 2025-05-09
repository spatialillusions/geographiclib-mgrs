import CONSTANTS from "./constants.mjs";
import MATH from "./math.mjs";

/**
 * \brief Polar stereographic projection
 *
 * Implementation taken from the report,
 * - J. P. Snyder,
 *   <a href="https://pubs.usgs.gov/publication/pp1395"> Map Projections: A
 *   Working Manual</a>, USGS Professional Paper 1395 (1987),
 *   pp. 160--163.
 *
 * This is a straightforward implementation of the equations in Snyder except
 * that Newton's method is used to invert the projection.
 *
 * This class also returns the meridian convergence \e gamma and scale \e k.
 * The meridian convergence is the bearing of grid north (the \e y axis)
 * measured clockwise from true north.
 *
 * Example of use:
 * \include example-PolarStereographic.cpp
 **********************************************************************/

const PolarStereographic = {
  init(a, f, k0) {
    this._a = a;
    this._f = f;
    this._e2 = this._f * (2 - this._f);
    this._es = (this._f < 0 ? -1 : 1) * Math.sqrt(Math.abs(this._e2));
    this._e2m = 1 - this._e2;
    this._c = (1 - this._f) * Math.exp(MATH.eatanhe(1, this._es));
    this._k0 = k0;

    if (!(isFinite(this._a) && this._a > 0))
      throw new Error("Equatorial radius is not positive");
    if (!(isFinite(this._f) && this._f < 1))
      throw new Error("Polar semi-axis is not positive");
    if (!(isFinite(this._k0) && this._k0 > 0))
      throw new Error("Scale is not positive");
  },

  UPS() {
    const ups = Object.create(PolarStereographic);
    ups.init(CONSTANTS.WGS84_a(), CONSTANTS.WGS84_f(), CONSTANTS.UPS_k0());
    return ups;
  },

  forward(northp, lat, lon) {
    lat = MATH.latFix(lat);
    lat *= northp ? 1 : -1;
    const tau = MATH.tand(lat);
    const secphi = Math.hypot(1, tau);
    const taup = MATH.taupf(tau, this._es);
    let rho = Math.hypot(1, taup) + Math.abs(taup);
    rho = taup >= 0 ? (lat !== MATH.qd ? 1 / rho : 0) : rho;
    rho *= (2 * this._k0 * this._a) / this._c;
    const k =
      lat !== MATH.qd
        ? (rho / this._a) *
          secphi *
          Math.sqrt(this._e2m + this._e2 / MATH.sq(secphi))
        : this._k0;
    let [x, y] = MATH.sincosd(lon);
    x *= rho;
    y *= northp ? -rho : rho;
    const gamma = MATH.angNormalize(northp ? lon : -lon);
    return { x, y, gamma, k };
  },

  reverse(northp, x, y) {
    const rho = Math.hypot(x, y);
    const t =
      rho !== 0
        ? rho / ((2 * this._k0 * this._a) / this._c)
        : MATH.sq(Number.EPSILON);
    const taup = (1 / t - t) / 2;
    const tau = MATH.tauf(taup, this._es);
    const secphi = Math.hypot(1, tau);
    let k =
      rho !== 0
        ? (rho / this._a) *
          secphi *
          Math.sqrt(this._e2m + this._e2 / MATH.sq(secphi))
        : this._k0;
    let lat = (northp ? 1 : -1) * MATH.atand(tau);
    let lon = MATH.atan2d(x, northp ? -y : y);
    let gamma = MATH.angNormalize(northp ? lon : -lon);
    return { lat: lat, lon: lon, gamma: gamma, k: k };
  },

  setScale(lat, k) {
    if (!(isFinite(k) && k > 0)) throw new Error("Scale is not positive");
    if (!(-MATH.qd < lat && lat <= MATH.qd))
      throw new Error(`Latitude must be in (-${MATH.qd}d, ${MATH.qd}d]`);
    let x, y, gamma, kold;
    this._k0 = 1;
    this.forward(true, lat, 0, x, y, gamma, kold);
    this._k0 *= k / kold;
  },
};

export default PolarStereographic;
