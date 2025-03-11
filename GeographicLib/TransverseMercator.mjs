import CONSTANTS from "../includes/constants.mjs";
import MATH from "../includes/math.mjs";
import TransverseMercatorExact from "./TransverseMercatorExact.mjs";
import Complex from "./Complex.mjs";

const maxpow = 6;

const TransverseMercator = {
  init(a, f, k0, exact = false, extendp = false) {
    this._a = a;
    this._f = f;
    this._k0 = k0;
    this._exact = exact;
    this._e2 = this._f * (2 - this._f);
    this._es = (this._f < 0 ? -1 : 1) * Math.sqrt(Math.abs(this._e2));
    this._e2m = 1 - this._e2;
    this._c = Math.sqrt(this._e2m) * Math.exp(MATH.eatanhe(1, this._es));
    this._n = this._f / (2 - this._f);
    this._tmexact = this._exact
      ? TransverseMercatorExact.init(a, f, k0, extendp)
      : {}; //TransverseMercatorExact.init();

    if (this._exact) return;
    if (!(isFinite(this._a) && this._a > 0))
      throw new Error("Equatorial radius is not positive");
    if (!(isFinite(this._f) && this._f < 1))
      throw new Error("Polar semi-axis is not positive");
    if (!(isFinite(this._k0) && this._k0 > 0))
      throw new Error("Scale is not positive");
    if (extendp)
      throw new Error("TransverseMercator extendp not allowed if !exact");

    // Coefficients for the series expansion
    const b1coeff = [
      31564, -66675, 34440, 47250, -100800, 75600, 151200, -1983433, 863232,
      748608, -1161216, 524160, 1935360, 670412, 406647, -533952, 184464,
      725760, 6601661, -7732800, 2230245, 7257600, -13675556, 3438171, 7983360,
      212378941, 319334400,
    ];

    const alpcoeff = [
      31564, -66675, 34440, 47250, -100800, 75600, 151200, -1983433, 863232,
      748608, -1161216, 524160, 1935360, 670412, 406647, -533952, 184464,
      725760, 6601661, -7732800, 2230245, 7257600, -13675556, 3438171, 7983360,
      212378941, 319334400,
    ];

    const betcoeff = [
      384796, -382725, -6720, 932400, -1612800, 1209600, 2419200, -1118711,
      1695744, -1174656, 258048, 80640, 3870720, 22276, -16929, -15984, 12852,
      362880, -830251, -158400, 197865, 7257600, -435388, 453717, 15966720,
      20648693, 638668800,
    ];

    const maxpow = 6;
    const m = maxpow / 2;
    this._b1 =
      MATH.polyval(m, b1coeff, MATH.sq(this._n)) /
      (b1coeff[m + 1] * (1 + this._n));
    this._a1 = this._b1 * this._a;
    let o = 0;
    let d = this._n;
    this._alp = [];
    this._bet = [];
    for (let l = 1; l <= maxpow; ++l) {
      const m = maxpow - l;
      this._alp[l] =
        (d * MATH.polyval(m, alpcoeff.slice(o), this._n)) / alpcoeff[o + m + 1];
      this._bet[l] =
        (d * MATH.polyval(m, betcoeff.slice(o), this._n)) / betcoeff[o + m + 1];
      o += m + 2;
      d *= this._n;
    }
  },

  UTM() {
    const utm = Object.create(TransverseMercator);
    utm.init(CONSTANTS.WGS84_a(), CONSTANTS.WGS84_f(), CONSTANTS.UTM_k0());
    return utm;
  },

  Forward(lon0, lat, lon, x, y, gamma, k) {
    if (this._exact)
      return this._tmexact.Forward(lon0, lat, lon, x, y, gamma, k);
    lat = MATH.LatFix(lat);
    lon = MATH.AngDiff(lon0, lon);
    const latsign = Math.sign(lat);
    const lonsign = Math.sign(lon);
    lon *= lonsign;
    lat *= latsign;
    const backside = lon > MATH.qd;
    if (backside) {
      if (lat === 0) latsign = -1;
      lon = MATH.hd - lon;
    }
    const [sphi, cphi] = MATH.sincosd(lat);
    const [slam, clam] = MATH.sincosd(lon);
    let etap, xip;
    if (lat !== MATH.qd) {
      const tau = sphi / cphi;
      const taup = MATH.taupf(tau, this._es);
      xip = Math.atan2(taup, clam);
      etap = Math.asinh(slam / Math.hypot(taup, clam));
      gamma = MATH.atan2d(slam * taup, clam * Math.hypot(1, taup));
      k =
        (Math.sqrt(this._e2m + this._e2 * MATH.sq(cphi)) * Math.hypot(1, tau)) /
        Math.hypot(taup, clam);
    } else {
      xip = Math.PI / 2;
      etap = 0;
      gamma = lon;
      k = this._c;
    }
    const c0 = Math.cos(2 * xip);
    const ch0 = Math.cosh(2 * etap);
    const s0 = Math.sin(2 * xip);
    const sh0 = Math.sinh(2 * etap);
    let a = new Complex(2 * c0 * ch0, -2 * s0 * sh0);
    let n = maxpow;
    let y0 = new Complex(n & 1 ? this._alp[n] : 0, 0);
    let y1 = new Complex(0, 0);
    let z0 = new Complex(n & 1 ? 2 * n * this._alp[n] : 0, 0);
    let z1 = new Complex(0, 0);
    if (n & 1) --n;
    while (n) {
      y1 = a.mul(y0).sub(y1).add(this._alp[n]);
      z1 = a
        .mul(z0)
        .sub(z1)
        .add(2 * n * this._alp[n]);
      --n;
      y0 = a.mul(y1).sub(y0).add(this._alp[n]);
      z0 = a
        .mul(z1)
        .sub(z0)
        .add(2 * n * this._alp[n]);
      --n;
    }
    a = a.div(2);
    z1 = Complex.ONE.sub(z1).add(a.mul(z0));
    a = new Complex(s0 * ch0, c0 * sh0);
    y1 = new Complex(xip, etap).add(a.mul(y0));
    gamma -= MATH.atan2d(z1.imag, z1.real);
    k *= this._b1 * z1.abs();
    const xi = y1.real;
    const eta = y1.imag;
    y = this._a1 * this._k0 * (backside ? Math.PI - xi : xi) * latsign;
    x = this._a1 * this._k0 * eta * lonsign;
    if (backside) gamma = MATH.hd - gamma;
    gamma *= latsign * lonsign;
    gamma = MATH.AngNormalize(gamma);
    k *= this._k0;
  },

  Reverse(lon0, x, y, lat, lon, gamma, k) {
    if (this._exact)
      return this._tmexact.Reverse(lon0, x, y, lat, lon, gamma, k);
    let xi = y / (this._a1 * this._k0);
    let eta = x / (this._a1 * this._k0);
    const xisign = Math.sign(xi);
    const etasign = Math.sign(eta);
    xi *= xisign;
    eta *= etasign;
    const backside = xi > Math.PI / 2;
    if (backside) xi = Math.PI - xi;
    const c0 = Math.cos(2 * xi);
    const ch0 = Math.cosh(2 * eta);
    const s0 = Math.sin(2 * xi);
    const sh0 = Math.sinh(2 * eta);
    let a = new Complex(2 * c0 * ch0, -2 * s0 * sh0);
    let n = maxpow;
    let y0 = new Complex(n & 1 ? -this._bet[n] : 0, 0);
    let y1 = new Complex(0, 0);
    let z0 = new Complex(n & 1 ? -2 * n * this._bet[n] : 0, 0);
    let z1 = new Complex(0, 0);
    if (n & 1) --n;
    while (n) {
      y1 = a.mul(y0).sub(y1).sub(new Complex(this._bet[n], 0));
      z1 = a
        .mul(z0)
        .sub(z1)
        .sub(new Complex(2 * n * this._bet[n], 0));
      --n;
      y0 = a.mul(y1).sub(y0).sub(new Complex(this._bet[n], 0));
      z0 = a
        .mul(z1)
        .sub(z0)
        .sub(new Complex(2 * n * this._bet[n], 0));
      --n;
    }
    a = a.div(new Complex(2, 0));
    z1 = new Complex(1, 0).sub(z1).add(a.mul(z0));
    a = new Complex(s0 * ch0, c0 * sh0);
    y1 = new Complex(xi, eta).add(a.mul(y0));

    gamma = MATH.atan2d(z1.imag, z1.real);
    k = this._b1 / z1.abs();
    const xip = y1.real;
    const etap = y1.imag;
    const s = Math.sinh(etap);
    const c = Math.max(0, Math.cos(xip));
    const r = Math.hypot(s, c);
    if (r !== 0) {
      lon = MATH.atan2d(s, c);
      const sxip = Math.sin(xip);
      const tau = MATH.tauf(sxip / r, this._es);
      gamma += MATH.atan2d(sxip * Math.tanh(etap), c);
      lat = MATH.atand(tau);
      k *=
        Math.sqrt(this._e2m + this._e2 / (1 + MATH.sq(tau))) *
        Math.hypot(1, tau) *
        r;
    } else {
      lat = MATH.qd;
      lon = 0;
      k *= this._c;
    }
    lat *= xisign;
    if (backside) lon = MATH.hd - lon;
    lon *= etasign;
    lon = MATH.AngNormalize(lon + lon0);
    if (backside) gamma = MATH.hd - gamma;
    gamma *= xisign * etasign;
    gamma = MATH.AngNormalize(gamma);
    k *= this._k0;
    console.log({ lon: lon, lat: lat, gamma: gamma, k: k });
  },
};

export default TransverseMercator;
