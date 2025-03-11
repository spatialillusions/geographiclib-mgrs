import CONSTANTS from "../includes/constants.mjs";
import MATH from "../includes/math.mjs";

const TransverseMercatorExact = {
  init(a, f, k0, extendp = false) {
    this.tol_ = Number.EPSILON;
    this.tol2_ = 0.1 * this.tol_;
    this.taytol_ = Math.pow(this.tol_, 0.6);
    this._a = a;
    this._f = f;
    this._k0 = k0;
    this._mu = this._f * (2 - this._f); // e^2
    this._mv = 1 - this._mu; // 1 - e^2
    this._e = Math.sqrt(this._mu);
    this._extendp = extendp;
    this._eEu = this._mu;
    this._eEv = this._mv;
    if (!(Number.isFinite(this._a) && this._a > 0))
      throw new Error("Equatorial radius is not positive");
    if (!(this._f > 0)) throw new Error("Flattening is not positive");
    if (!(this._f < 1)) throw new Error("Polar semi-axis is not positive");
    if (!(Number.isFinite(this._k0) && this._k0 > 0))
      throw new Error("Scale is not positive");
  },

  UTM() {
    const utm = Object.create(TransverseMercatorExact);
    utm.init(CONSTANTS.WGS84_a(), CONSTANTS.WGS84_f(), CONSTANTS.UTM_k0());
    return utm;
  },

  zeta(u, snu, cnu, dnu, v, snv, cnv, dnv, taup, lam) {
    const overflow = 1 / Math.pow(Number.EPSILON, 2);
    const d1 = Math.sqrt(Math.pow(cnu, 2) + this._mv * Math.pow(snu * snv, 2));
    const d2 = Math.sqrt(
      this._mu * Math.pow(cnu, 2) + this._mv * Math.pow(cnv, 2),
    );
    const t1 =
      d1 !== 0 ? (snu * dnv) / d1 : Math.sign(snu) ? -overflow : overflow;
    const t2 =
      d2 !== 0
        ? Math.sinh(this._e * Math.asinh((this._e * snu) / d2))
        : Math.sign(snu)
        ? -overflow
        : overflow;
    taup = t1 * Math.hypot(1, t2) - t2 * Math.hypot(1, t1);
    lam =
      d1 !== 0 && d2 !== 0
        ? Math.atan2(dnu * snv, cnu * cnv) -
          this._e * Math.atan2(this._e * cnu * snv, dnu * cnv)
        : 0;
  },

  dwdzeta(u, snu, cnu, dnu, v, snv, cnv, dnv, du, dv) {
    const d =
      this._mv *
      Math.pow(Math.pow(cnv, 2) + this._mu * Math.pow(snu * snv, 2), 2);
    du =
      (cnu *
        dnu *
        dnv *
        (Math.pow(cnv, 2) - this._mu * Math.pow(snu * snv, 2))) /
      d;
    dv =
      (-snu *
        snv *
        cnv *
        (Math.pow(dnu * dnv, 2) + this._mu * Math.pow(cnu, 2))) /
      d;
  },

  zetainv0(psi, lam, u, v) {
    let retval = false;
    if (
      psi < (-this._e * Math.PI) / 4 &&
      lam > ((1 - 2 * this._e) * Math.PI) / 2 &&
      psi < lam - ((1 - this._e) * Math.PI) / 2
    ) {
      const psix = 1 - psi / this._e;
      const lamx = (Math.PI / 2 - lam) / this._e;
      u =
        Math.asinh(
          Math.sin(lamx) / Math.hypot(Math.cos(lamx), Math.sinh(psix)),
        ) *
        (1 + this._mu / 2);
      v = Math.atan2(Math.cos(lamx), Math.sinh(psix)) * (1 + this._mu / 2);
      u = this._eEu.K() - u;
      v = this._eEv.K() - v;
    } else if (
      psi < (this._e * Math.PI) / 2 &&
      lam > ((1 - 2 * this._e) * Math.PI) / 2
    ) {
      const dlam = lam - ((1 - this._e) * Math.PI) / 2;
      let rad = Math.hypot(psi, dlam);
      let ang = Math.atan2(dlam - psi, psi + dlam) - 0.75 * Math.PI;
      retval = rad < this._e * this.taytol_;
      rad = Math.cbrt((3 / (this._mv * this._e)) * rad);
      ang /= 3;
      u = rad * Math.cos(ang);
      v = rad * Math.sin(ang) + this._eEv.K();
    } else {
      v = Math.asinh(Math.sin(lam) / Math.hypot(Math.cos(lam), Math.sinh(psi)));
      u = Math.atan2(Math.sinh(psi), Math.cos(lam));
      u *= this._eEu.K() / (Math.PI / 2);
      v *= this._eEu.K() / (Math.PI / 2);
    }
    return retval;
  },

  zetainv(taup, lam, u, v) {
    const psi = Math.asinh(taup);
    const scal = 1 / Math.hypot(1, taup);
    if (this.zetainv0(psi, lam, u, v)) return;
    const stol2 = this.tol2_ / Math.pow(Math.max(psi, 1), 2);
    for (let i = 0, trip = 0; i < 6; ++i) {
      let snu, cnu, dnu, snv, cnv, dnv;
      this._eEu.am(u, snu, cnu, dnu);
      this._eEv.am(v, snv, cnv, dnv);
      let tau1, lam1, du1, dv1;
      this.zeta(u, snu, cnu, dnu, v, snv, cnv, dnv, tau1, lam1);
      this.dwdzeta(u, snu, cnu, dnu, v, snv, cnv, dnv, du1, dv1);
      tau1 -= taup;
      lam1 -= lam;
      tau1 *= scal;
      const delu = tau1 * du1 - lam1 * dv1;
      const delv = tau1 * dv1 + lam1 * du1;
      u -= delu;
      v -= delv;
      if (trip) break;
      const delw2 = Math.pow(delu, 2) + Math.pow(delv, 2);
      if (!(delw2 >= stol2)) ++trip;
    }
  },

  sigma(u, snu, cnu, dnu, v, snv, cnv, dnv, xi, eta) {
    const d = this._mu * Math.pow(cnu, 2) + this._mv * Math.pow(cnv, 2);
    xi = this._eEu.E(snu, cnu, dnu) - (this._mu * snu * cnu * dnu) / d;
    eta = v - this._eEv.E(snv, cnv, dnv) + (this._mv * snv * cnv * dnv) / d;
  },

  dwdsigma(u, snu, cnu, dnu, v, snv, cnv, dnv, du, dv) {
    const d =
      this._mv *
      Math.pow(Math.pow(cnv, 2) + this._mu * Math.pow(snu * snv, 2), 2);
    const dnr = dnu * cnv * dnv;
    const dni = -this._mu * snu * cnu * snv;
    du = (Math.pow(dnr, 2) - Math.pow(dni, 2)) / d;
    dv = (2 * dnr * dni) / d;
  },

  sigmainv0(xi, eta, u, v) {
    let retval = false;
    if (
      eta > 1.25 * this._eEv.KE() ||
      (xi < -0.25 * this._eEu.E() && xi < eta - this._eEv.KE())
    ) {
      const x = xi - this._eEu.E();
      const y = eta - this._eEv.KE();
      const r2 = Math.pow(x, 2) + Math.pow(y, 2);
      u = this._eEu.K() + x / r2;
      v = this._eEv.K() - y / r2;
    } else if (
      (eta > 0.75 * this._eEv.KE() && xi < 0.25 * this._eEu.E()) ||
      eta > this._eEv.KE()
    ) {
      const deta = eta - this._eEv.KE();
      let rad = Math.hypot(xi, deta);
      let ang = Math.atan2(deta - xi, xi + deta) - 0.75 * Math.PI;
      retval = rad < 2 * this.taytol_;
      rad = Math.cbrt((3 / this._mv) * rad);
      ang /= 3;
      u = rad * Math.cos(ang);
      v = rad * Math.sin(ang) + this._eEv.K();
    } else {
      u = (xi * this._eEu.K()) / this._eEu.E();
      v = (eta * this._eEu.K()) / this._eEu.E();
    }
    return retval;
  },

  sigmainv(xi, eta, u, v) {
    if (this.sigmainv0(xi, eta, u, v)) return;
    for (let i = 0, trip = 0; i < 7; ++i) {
      let snu, cnu, dnu, snv, cnv, dnv;
      this._eEu.am(u, snu, cnu, dnu);
      this._eEv.am(v, snv, cnv, dnv);
      let xi1, eta1, du1, dv1;
      this.sigma(u, snu, cnu, dnu, v, snv, cnv, dnv, xi1, eta1);
      this.dwdsigma(u, snu, cnu, dnu, v, snv, cnv, dnv, du1, dv1);
      xi1 -= xi;
      eta1 -= eta;
      const delu = xi1 * du1 - eta1 * dv1;
      const delv = xi1 * dv1 + eta1 * du1;
      u -= delu;
      v -= delv;
      if (trip) break;
      const delw2 = Math.pow(delu, 2) + Math.pow(delv, 2);
      if (!(delw2 >= this.tol2_)) ++trip;
    }
  },

  Scale(tau, lam, snu, cnu, dnu, snv, cnv, dnv, gamma, k) {
    const sec2 = 1 + Math.pow(tau, 2);
    gamma = Math.atan2(this._mv * snu * snv * cnv, cnu * dnu * dnv);
    k =
      Math.sqrt(this._mv + this._mu / sec2) *
      Math.sqrt(sec2) *
      Math.sqrt(
        (this._mv * Math.pow(snv, 2) + Math.pow(cnu * dnv, 2)) /
          (this._mu * Math.pow(cnu, 2) + this._mv * Math.pow(cnv, 2)),
      );
  },

  Forward(lon0, lat, lon, x, y, gamma, k) {
    lat = MATH.LatFix(lat);
    lon = MATH.AngDiff(lon0, lon);
    const latsign = !this._extendp && Math.sign(lat) ? -1 : 1;
    const lonsign = !this._extendp && Math.sign(lon) ? -1 : 1;
    lon *= lonsign;
    lat *= latsign;
    const backside = !this._extendp && lon > MATH.qd;
    if (backside) {
      if (lat === 0) latsign = -1;
      lon = MATH.hd - lon;
    }
    const lam = lon * MATH.degree();
    const tau = MATH.tand(lat);
    let u, v;
    if (lat === MATH.qd) {
      u = this._eEu.K();
      v = 0;
    } else if (lat === 0 && lon === MATH.qd * (1 - this._e)) {
      u = 0;
      v = this._eEv.K();
    } else {
      this.zetainv(MATH.taupf(tau, this._e), lam, u, v);
    }
    let snu, cnu, dnu, snv, cnv, dnv;
    this._eEu.am(u, snu, cnu, dnu);
    this._eEv.am(v, snv, cnv, dnv);
    let xi, eta;
    this.sigma(u, snu, cnu, dnu, v, snv, cnv, dnv, xi, eta);
    if (backside) xi = 2 * this._eEu.E() - xi;
    y = xi * this._a * this._k0 * latsign;
    x = eta * this._a * this._k0 * lonsign;
    if (lat === MATH.qd) {
      gamma = lon;
      k = 1;
    } else {
      this.zeta(u, snu, cnu, dnu, v, snv, cnv, dnv, tau, lam);
      tau = MATH.tauf(tau, this._e);
      this.Scale(tau, lam, snu, cnu, dnu, snv, cnv, dnv, gamma, k);
      gamma /= MATH.degree();
    }
    if (backside) gamma = MATH.hd - gamma;
    gamma *= latsign * lonsign;
    k *= this._k0;
  },

  Reverse(lon0, x, y, lat, lon, gamma, k) {
    const xi = y / (this._a * this._k0);
    const eta = x / (this._a * this._k0);
    const xisign = !this._extendp && Math.sign(xi) ? -1 : 1;
    const etasign = !this._extendp && Math.sign(eta) ? -1 : 1;
    xi *= xisign;
    eta *= etasign;
    const backside = !this._extendp && xi > this._eEu.E();
    if (backside) xi = 2 * this._eEu.E() - xi;
    let u, v;
    if (xi === 0 && eta === this._eEv.KE()) {
      u = 0;
      v = this._eEv.K();
    } else {
      this.sigmainv(xi, eta, u, v);
    }
    let snu, cnu, dnu, snv, cnv, dnv;
    this._eEu.am(u, snu, cnu, dnu);
    this._eEv.am(v, snv, cnv, dnv);
    let phi, lam, tau;
    if (v !== 0 || u !== this._eEu.K()) {
      this.zeta(u, snu, cnu, dnu, v, snv, cnv, dnv, tau, lam);
      tau = MATH.tauf(tau, this._e);
      phi = Math.atan(tau);
      lat = phi / MATH.degree();
      lon = lam / MATH.degree();
      this.Scale(tau, lam, snu, cnu, dnu, snv, cnv, dnv, gamma, k);
      gamma /= MATH.degree();
    } else {
      lat = MATH.qd;
      lon = lam = gamma = 0;
      k = 1;
    }
    if (backside) lon = MATH.hd - lon;
    lon *= etasign;
    lon = MATH.AngNormalize(lon + MATH.AngNormalize(lon0));
    lat *= xisign;
    if (backside) gamma = MATH.hd - gamma;
    gamma *= xisign * etasign;
    k *= this._k0;
  },
};

export default TransverseMercatorExact;
