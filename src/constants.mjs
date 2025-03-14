import MATH from "./math.mjs";

const CONSTANTS = {
  // Constants defining the WGS84 ellipsoid, the UTM and UPS projections, and various unit conversions.

  degree() {
    return MATH.degree();
  },

  arcminute() {
    return this.degree() / MATH.dm;
  },

  arcsecond() {
    return this.degree() / MATH.ds;
  },

  // Ellipsoid parameters
  WGS84_a() {
    return 6378137 * this.meter();
  },

  WGS84_f() {
    // Evaluating this as 1000000000 / T(298257223563LL) reduces the
    // round-off error by about 10%.  However, expressing the flattening as
    // 1/298.257223563 is well ingrained.
    //return 1 / 298.257223563;
    return 1000000000 / 298257223563;
  },

  WGS84_GM() {
    return 3986004 * 100000000 + 41800000;
  },

  WGS84_omega() {
    return 7292115 / (1000000 * 100000);
  },

  GRS80_a() {
    return 6378137 * this.meter();
  },

  GRS80_GM() {
    return 3986005 * 100000000;
  },

  GRS80_omega() {
    return 7292115 / (1000000 * 100000);
  },

  GRS80_J2() {
    return 108263 / 100000000;
  },

  UTM_k0() {
    return 9996 / 10000;
  },

  UPS_k0() {
    return 994 / 1000;
  },

  // SI units
  meter() {
    return 1;
  },

  kilometer() {
    return 1000 * this.meter();
  },

  nauticalmile() {
    return 1852 * this.meter();
  },

  square_meter() {
    return this.meter() * this.meter();
  },

  hectare() {
    return 10000 * this.square_meter();
  },

  square_kilometer() {
    return this.kilometer() * this.kilometer();
  },

  square_nauticalmile() {
    return this.nauticalmile() * this.nauticalmile();
  },

  // Anachronistic British units
  foot() {
    return ((254 * 12) / 10000) * this.meter();
  },

  yard() {
    return 3 * this.foot();
  },

  fathom() {
    return 2 * this.yard();
  },

  chain() {
    return 22 * this.yard();
  },

  furlong() {
    return 10 * this.chain();
  },

  mile() {
    return 8 * this.furlong();
  },

  acre() {
    return this.chain() * this.furlong();
  },

  square_mile() {
    return this.mile() * this.mile();
  },

  // Anachronistic US units
  surveyfoot() {
    return (1200 / 3937) * this.meter();
  },
};

export default CONSTANTS;
