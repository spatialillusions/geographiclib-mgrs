import CONSTANTS from "./constants.mjs";
import MATH from "./math.mjs";
import TransverseMercatorExact from "./transverse-mercator-exact.mjs";
import Complex from "./complex.mjs";

/**
 * \file TransverseMercator.cpp
 * \brief Implementation for GeographicLib::TransverseMercator class
 *
 * Copyright (c) Charles Karney (2008-2023) <karney@alum.mit.edu> and licensed
 * under the MIT/X11 License.  For more information, see
 * https://geographiclib.sourceforge.io/
 *
 * This implementation follows closely JHS 154, ETRS89 -
 * j&auml;rjestelm&auml;&auml;n liittyv&auml;t karttaprojektiot,
 * tasokoordinaatistot ja karttalehtijako</a> (Map projections, plane
 * coordinates, and map sheet index for ETRS89), published by JUHTA, Finnish
 * Geodetic Institute, and the National Land Survey of Finland (2006).
 *
 * The relevant section is available as the 2008 PDF file
 * http://docs.jhs-suositukset.fi/jhs-suositukset/JHS154/JHS154_liite1.pdf
 *
 * This is a straight transcription of the formulas in this paper with the
 * following exceptions:
 *  - use of 6th order series instead of 4th order series.  This reduces the
 *    error to about 5nm for the UTM range of coordinates (instead of 200nm),
 *    with a speed penalty of only 1%;
 *  - use Newton's method instead of plain iteration to solve for latitude in
 *    terms of isometric latitude in the Reverse method;
 *  - use of Horner's representation for evaluating polynomials and Clenshaw's
 *    method for summing trigonometric series;
 *  - several modifications of the formulas to improve the numerical accuracy;
 *  - evaluating the convergence and scale using the expression for the
 *    projection or its inverse.
 *
 * If the preprocessor variable GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER is set
 * to an integer between 4 and 8, then this specifies the order of the series
 * used for the forward and reverse transformations.  The default value is 6.
 * (The series accurate to 12th order is given in \ref tmseries.)
 **********************************************************************/

const maxpow = 6;
const GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER = 6;

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
      : {}; //if not exact we don't need to initiate this TransverseMercatorExact.init();

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
    let b1coeff;
    if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER / 2 == 2) {
      b1coeff = [
        // b1*(n+1), polynomial in n2 of order 2
        1, 16, 64, 64,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER / 2 == 3) {
      b1coeff = [
        // b1*(n+1), polynomial in n2 of order 3
        1, 4, 64, 256, 256,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER / 2 == 4) {
      b1coeff = [
        // b1*(n+1), polynomial in n2 of order 4
        25, 64, 256, 4096, 16384, 16384,
      ];
    } else {
      throw Error("Bad value for GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER");
    }

    let alpcoeff;
    if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 4) {
      alpcoeff = [
        // alp[1]/n^1, polynomial in n of order 3
        164, 225, -480, 360, 720,
        // alp[2]/n^2, polynomial in n of order 2
        557, -864, 390, 1440,
        // alp[3]/n^3, polynomial in n of order 1
        -1236, 427, 1680,
        // alp[4]/n^4, polynomial in n of order 0
        49561, 161280,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 5) {
      alpcoeff = [
        // alp[1]/n^1, polynomial in n of order 4
        -635, 328, 450, -960, 720, 1440,
        // alp[2]/n^2, polynomial in n of order 3
        4496, 3899, -6048, 2730, 10080,
        // alp[3]/n^3, polynomial in n of order 2
        15061, -19776, 6832, 26880,
        // alp[4]/n^4, polynomial in n of order 1
        -171840, 49561, 161280,
        // alp[5]/n^5, polynomial in n of order 0
        34729, 80640,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 6) {
      alpcoeff = [
        // alp[1]/n^1, polynomial in n of order 5
        31564, -66675, 34440, 47250, -100800, 75600, 151200,
        // alp[2]/n^2, polynomial in n of order 4
        -1983433, 863232, 748608, -1161216, 524160, 1935360,
        // alp[3]/n^3, polynomial in n of order 3
        670412, 406647, -533952, 184464, 725760,
        // alp[4]/n^4, polynomial in n of order 2
        6601661, -7732800, 2230245, 7257600,
        // alp[5]/n^5, polynomial in n of order 1
        -13675556, 3438171, 7983360,
        // alp[6]/n^6, polynomial in n of order 0
        212378941, 319334400,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 7) {
      alpcoeff = [
        // alp[1]/n^1, polynomial in n of order 6
        1804025, 2020096, -4267200, 2204160, 3024000, -6451200, 4838400,
        9676800,
        // alp[2]/n^2, polynomial in n of order 5
        4626384, -9917165, 4316160, 3743040, -5806080, 2620800, 9676800,
        // alp[3]/n^3, polynomial in n of order 4
        -67102379, 26816480, 16265880, -21358080, 7378560, 29030400,
        // alp[4]/n^4, polynomial in n of order 3
        155912000, 72618271, -85060800, 24532695, 79833600,
        // alp[5]/n^5, polynomial in n of order 2
        102508609, -109404448, 27505368, 63866880,
        // alp[6]/n^6, polynomial in n of order 1
        -12282192400, 2760926233, 4151347200,
        // alp[7]/n^7, polynomial in n of order 0
        1522256789, 1383782400,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 8) {
      alpcoeff = [
        // alp[1]/n^1, polynomial in n of order 7
        -75900428, 37884525, 42422016, -89611200, 46287360, 63504000,
        -135475200, 101606400, 203212800,
        // alp[2]/n^2, polynomial in n of order 6
        148003883, 83274912, -178508970, 77690880, 67374720, -104509440,
        47174400, 174182400,
        // alp[3]/n^3, polynomial in n of order 5
        318729724, -738126169, 294981280, 178924680, -234938880, 81164160,
        319334400,
        // alp[4]/n^4, polynomial in n of order 4
        -40176129013, 14967552000, 6971354016, -8165836800, 2355138720,
        7664025600,
        // alp[5]/n^5, polynomial in n of order 3
        10421654396, 3997835751, -4266773472, 1072709352, 2490808320,
        // alp[6]/n^6, polynomial in n of order 2
        175214326799, -171950693600, 38652967262, 58118860800,
        // alp[7]/n^7, polynomial in n of order 1
        -67039739596, 13700311101, 12454041600,
        // alp[8]/n^8, polynomial in n of order 0
        1424729850961, 743921418240,
      ];
    } else {
      throw Error("Bad value for GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER");
    }

    let betcoeff;
    if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 4) {
      betcoeff = [
        // bet[1]/n^1, polynomial in n of order 3
        -4, 555, -960, 720, 1440,
        // bet[2]/n^2, polynomial in n of order 2
        -437, 96, 30, 1440,
        // bet[3]/n^3, polynomial in n of order 1
        -148, 119, 3360,
        // bet[4]/n^4, polynomial in n of order 0
        4397, 161280,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 5) {
      betcoeff = [
        // bet[1]/n^1, polynomial in n of order 4
        -3645, -64, 8880, -15360, 11520, 23040,
        // bet[2]/n^2, polynomial in n of order 3
        4416, -3059, 672, 210, 10080,
        // bet[3]/n^3, polynomial in n of order 2
        -627, -592, 476, 13440,
        // bet[4]/n^4, polynomial in n of order 1
        -3520, 4397, 161280,
        // bet[5]/n^5, polynomial in n of order 0
        4583, 161280,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 6) {
      betcoeff = [
        // bet[1]/n^1, polynomial in n of order 5
        384796, -382725, -6720, 932400, -1612800, 1209600, 2419200,
        // bet[2]/n^2, polynomial in n of order 4
        -1118711, 1695744, -1174656, 258048, 80640, 3870720,
        // bet[3]/n^3, polynomial in n of order 3
        22276, -16929, -15984, 12852, 362880,
        // bet[4]/n^4, polynomial in n of order 2
        -830251, -158400, 197865, 7257600,
        // bet[5]/n^5, polynomial in n of order 1
        -435388, 453717, 15966720,
        // bet[6]/n^6, polynomial in n of order 0
        20648693, 638668800,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 7) {
      betcoeff = [
        // bet[1]/n^1, polynomial in n of order 6
        -5406467, 6156736, -6123600, -107520, 14918400, -25804800, 19353600,
        38707200,
        // bet[2]/n^2, polynomial in n of order 5
        829456, -5593555, 8478720, -5873280, 1290240, 403200, 19353600,
        // bet[3]/n^3, polynomial in n of order 4
        9261899, 3564160, -2708640, -2557440, 2056320, 58060800,
        // bet[4]/n^4, polynomial in n of order 3
        14928352, -9132761, -1742400, 2176515, 79833600,
        // bet[5]/n^5, polynomial in n of order 2
        -8005831, -1741552, 1814868, 63866880,
        // bet[6]/n^6, polynomial in n of order 1
        -261810608, 268433009, 8302694400,
        // bet[7]/n^7, polynomial in n of order 0
        219941297, 5535129600,
      ];
    } else if (GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER == 8) {
      betcoeff = [
        // bet[1]/n^1, polynomial in n of order 7
        31777436, -37845269, 43097152, -42865200, -752640, 104428800,
        -180633600, 135475200, 270950400,
        // bet[2]/n^2, polynomial in n of order 6
        24749483, 14930208, -100683990, 152616960, -105719040, 23224320,
        7257600, 348364800,
        // bet[3]/n^3, polynomial in n of order 5
        -232468668, 101880889, 39205760, -29795040, -28131840, 22619520,
        638668800,
        // bet[4]/n^4, polynomial in n of order 4
        324154477, 1433121792, -876745056, -167270400, 208945440, 7664025600,
        // bet[5]/n^5, polynomial in n of order 3
        457888660, -312227409, -67920528, 70779852, 2490808320,
        // bet[6]/n^6, polynomial in n of order 2
        -19841813847, -3665348512, 3758062126, 116237721600,
        // bet[7]/n^7, polynomial in n of order 1
        -1989295244, 1979471673, 49816166400,
        // bet[8]/n^8, polynomial in n of order 0
        191773887257, 3719607091200,
      ];
    } else {
      throw Error("Bad value for GEOGRAPHICLIB_TRANSVERSEMERCATOR_ORDER");
    }

    const maxpow = 6;
    const m = maxpow / 2;
    this._b1 =
      MATH.polyval(m, b1coeff, MATH.sq(this._n)) /
      (b1coeff[m + 1] * (1 + this._n));
    //this._b1 -= 0.000045;
    console.log("js b1", this._b1, "quit sure this is right");
    // _a1 is the equivalent radius for computing the circumference of
    // ellipse.
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
      //this._bet[l] += 0.00000047;
      o += m + 2;
      d *= this._n;
    }
    console.log("js bet", this._bet, "WE NEED TO VERIFY THIS CALCULATION");
  },

  UTM() {
    const utm = Object.create(TransverseMercator);
    utm.init(CONSTANTS.WGS84_a(), CONSTANTS.WGS84_f(), CONSTANTS.UTM_k0());
    return utm;
  },

  Forward(lon0, lat, lon) {
    if (this._exact) return this._tmexact.Forward(lon0, lat, lon);
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
    // phi = latitude
    // phi' = conformal latitude
    // psi = isometric latitude
    // tau = tan(phi)
    // tau' = tan(phi')
    // [xi', eta'] = Gauss-Schreiber TM coordinates
    // [xi, eta] = Gauss-Krueger TM coordinates
    //
    // We use
    //   tan(phi') = sinh(psi)
    //   sin(phi') = tanh(psi)
    //   cos(phi') = sech(psi)
    //   denom^2    = 1-cos(phi')^2*sin(lam)^2 = 1-sech(psi)^2*sin(lam)^2
    //   sin(xip)   = sin(phi')/denom          = tanh(psi)/denom
    //   cos(xip)   = cos(phi')*cos(lam)/denom = sech(psi)*cos(lam)/denom
    //   cosh(etap) = 1/denom                  = 1/denom
    //   sinh(etap) = cos(phi')*sin(lam)/denom = sech(psi)*sin(lam)/denom
    let etap, xip, gamma, k;
    let x, y;
    if (lat !== MATH.qd) {
      const tau = sphi / cphi;
      const taup = MATH.taupf(tau, this._es);
      xip = Math.atan2(taup, clam);
      // Used to be
      //   etap = Math::atanh(sin(lam) / cosh(psi));
      etap = Math.asinh(slam / Math.hypot(taup, clam));
      // convergence and scale for Gauss-Schreiber TM (xip, etap) -- gamma0 =
      // atan(tan(xip) * tanh(etap)) = atan(tan(lam) * sin(phi'));
      // sin(phi') = tau'/sqrt(1 + tau'^2)
      // Krueger p 22 (44)
      gamma = MATH.atan2d(slam * taup, clam * Math.hypot(1, taup));
      // k0 = sqrt(1 - _e2 * sin(phi)^2) * (cos(phi') / cos(phi)) * cosh(etap)
      // Note 1/cos(phi) = cosh(psip);
      // and cos(phi') * cosh(etap) = 1/hypot(sinh(psi), cos(lam))
      //
      // This form has cancelling errors.  This property is lost if cosh(psip)
      // is replaced by 1/cos(phi), even though it's using "primary" data (phi
      // instead of psip).
      k =
        (Math.sqrt(this._e2m + this._e2 * MATH.sq(cphi)) * Math.hypot(1, tau)) /
        Math.hypot(taup, clam);
    } else {
      xip = Math.PI / 2;
      etap = 0;
      gamma = lon;
      k = this._c;
    }
    // {xi',eta'} is {northing,easting} for Gauss-Schreiber transverse Mercator
    // (for eta' = 0, xi' = bet). {xi,eta} is {northing,easting} for transverse
    // Mercator with constant scale on the central meridian (for eta = 0, xip =
    // rectifying latitude).  Define
    //
    //   zeta = xi + i*eta
    //   zeta' = xi' + i*eta'
    //
    // The conversion from conformal to rectifying latitude can be expressed as
    // a series in _n:
    //
    //   zeta = zeta' + sum(h[j-1]' * sin(2 * j * zeta'), j = 1..maxpow_)
    //
    // where h[j]' = O(_n^j).  The reversion of this series gives
    //
    //   zeta' = zeta - sum(h[j-1] * sin(2 * j * zeta), j = 1..maxpow_)
    //
    // which is used in Reverse.
    //
    // Evaluate sums via Clenshaw method.  See
    //    https://en.wikipedia.org/wiki/Clenshaw_algorithm
    //
    // Let
    //
    //    S = sum(a[k] * phi[k](x), k = 0..n)
    //    phi[k+1](x) = alpha[k](x) * phi[k](x) + beta[k](x) * phi[k-1](x)
    //
    // Evaluate S with
    //
    //    b[n+2] = b[n+1] = 0
    //    b[k] = alpha[k](x) * b[k+1] + beta[k+1](x) * b[k+2] + a[k]
    //    S = (a[0] + beta[1](x) * b[2]) * phi[0](x) + b[1] * phi[1](x)
    //
    // Here we have
    //
    //    x = 2 * zeta'
    //    phi[k](x) = sin(k * x)
    //    alpha[k](x) = 2 * cos(x)
    //    beta[k](x) = -1
    //    [ sin(A+B) - 2*cos(B)*sin(A) + sin(A-B) = 0, A = k*x, B = x ]
    //    n = maxpow_
    //    a[k] = _alp[k]
    //    S = b[1] * sin(x)
    //
    // For the derivative we have
    //
    //    x = 2 * zeta'
    //    phi[k](x) = cos(k * x)
    //    alpha[k](x) = 2 * cos(x)
    //    beta[k](x) = -1
    //    [ cos(A+B) - 2*cos(B)*cos(A) + cos(A-B) = 0, A = k*x, B = x ]
    //    a[0] = 1; a[k] = 2*k*_alp[k]
    //    S = (a[0] - b[2]) + b[1] * cos(x)
    //
    // Matrix formulation (not used here):
    //    phi[k](x) = [sin(k * x); k * cos(k * x)]
    //    alpha[k](x) = 2 * [cos(x), 0; -sin(x), cos(x)]
    //    beta[k](x) = -1 * [1, 0; 0, 1]
    //    a[k] = _alp[k] * [1, 0; 0, 1]
    //    b[n+2] = b[n+1] = [0, 0; 0, 0]
    //    b[k] = alpha[k](x) * b[k+1] + beta[k+1](x) * b[k+2] + a[k]
    //    N.B., for all k: b[k](1,2) = 0; b[k](1,1) = b[k](2,2)
    //    S = (a[0] + beta[1](x) * b[2]) * phi[0](x) + b[1] * phi[1](x)
    //    phi[0](x) = [0; 0]
    //    phi[1](x) = [sin(x); cos(x)]
    const c0 = Math.cos(2 * xip);
    const ch0 = Math.cosh(2 * etap);
    const s0 = Math.sin(2 * xip);
    const sh0 = Math.sinh(2 * etap);
    let a = new Complex(2 * c0 * ch0, -2 * s0 * sh0);
    let n = maxpow;
    let y0 = new Complex(n & 1 ? this._alp[n] : 0, 0);
    let y1 = new Complex(0, 0);
    // Fold in change in convergence and scale for Gauss-Schreiber TM to
    // Gauss-Krueger TM.
    let z0 = new Complex(n & 1 ? 2 * n * this._alp[n] : 0, 0);
    let z1 = new Complex(0, 0);
    if (n & 1) --n;
    while (n) {
      y1 = a.mul(y0).sub(y1).add(new Complex(this._alp[n], 0));
      z1 = a
        .mul(z0)
        .sub(z1)
        .add(new Complex(2 * n * this._alp[n], 0));
      --n;
      y0 = a.mul(y1).sub(y0).add(new Complex(this._alp[n], 0));
      z0 = a
        .mul(z1)
        .sub(z0)
        .add(new Complex(2 * n * this._alp[n], 0));
      --n;
    }
    a = a.div(new Complex(2, 0));
    z1 = new Complex(1, 0).sub(z1).add(a.mul(z0));
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
    return { x, y, gamma, k };
  },

  Reverse(lon0, x, y) {
    let gamma, k, lat, lon;
    if (this._exact) return this._tmexact.Reverse(lon0, x, y);
    // This undoes the steps in Forward.  The wrinkles are: (1) Use of the
    // reverted series to express zeta' in terms of zeta. (2) Newton's method
    // to solve for phi in terms of tan(phi).
    console.log("js y", y);
    console.log("js x", x);
    console.log("js a1", this._a1);
    console.log("js k0", this._k0);
    let xi = y / (this._a1 * this._k0);
    let eta = x / (this._a1 * this._k0);
    console.log("js xi", xi);
    console.log("js eta", eta);
    // Explicitly enforce the parity
    const xisign = Math.sign(xi);
    const etasign = Math.sign(eta);
    xi *= xisign;
    eta *= etasign;
    console.log("js eta", eta);
    const backside = xi > Math.PI / 2;
    if (backside) xi = Math.PI - xi;
    console.log("js xi", xi);
    const c0 = Math.cos(2 * xi);
    const ch0 = Math.cosh(2 * eta);
    const s0 = Math.sin(2 * xi);
    const sh0 = Math.sinh(2 * eta);
    let a = new Complex(2 * c0 * ch0, -2 * s0 * sh0); // 2 * cos(2*zeta)
    let n = maxpow;
    let y0 = new Complex(n & 1 ? -this._bet[n] : 0, 0);
    let y1 = new Complex(0, 0); // default initializer is 0+i0
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
    a = a.div(new Complex(2, 0)); // cos(2*zeta)
    z1 = new Complex(1, 0).sub(z1).add(a.mul(z0));
    a = new Complex(s0 * ch0, c0 * sh0); // sin(2*zeta)
    y1 = new Complex(xi, eta).add(a.mul(y0));
    // Convergence and scale for Gauss-Schreiber TM to Gauss-Krueger TM.
    gamma = MATH.atan2d(z1.imag, z1.real);
    k = this._b1 / z1.abs();
    // JHS 154 has
    //
    //   phi' = asin(sin(xi') / cosh(eta')) (Krueger p 17 (25))
    //   lam = asin(tanh(eta') / cos(phi')
    //   psi = asinh(tan(phi'))
    const xip = y1.real;
    const etap = y1.imag;
    console.log("js xip", xip);
    console.log("js etap", etap);
    const s = Math.sinh(etap);
    const c = Math.max(0, Math.cos(xip)); // cos(pi/2) might be negative
    const r = Math.hypot(s, c);
    if (r !== 0) {
      lon = MATH.atan2d(s, c); // Krueger p 17 (25)
      // Use Newton's method to solve for tau
      const sxip = Math.sin(xip);
      console.log("js s", s);
      console.log("js c", c);
      console.log("js sxip", sxip);
      const tau = MATH.tauf(sxip / r, this._es);
      console.log("js tau", tau);
      gamma += MATH.atan2d(sxip * Math.tanh(etap), c);
      // MBC tau is + 0.000007 too small

      lat = MATH.atand(tau);
      console.log("result:  " + lat);
      console.log("correct: 9.042052");
      // Note cos(phi') * cosh(eta') = r
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
    console.log(`js lat: ${lat}, lon: ${lon}, gamma: ${gamma}, k: ${k}`);
    return { lat: lat, lon: lon, gamma: gamma, k: k };
  },
};

export default TransverseMercator;
