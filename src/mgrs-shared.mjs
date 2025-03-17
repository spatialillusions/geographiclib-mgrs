// Contains data that is shared between mgrs.mjs and utmups.mjs

const SHARED_MGRS = {
  hemispheres_: "SN",
  utmcols_: ["ABCDEFGH", "JKLMNPQR", "STUVWXYZ"],
  utmrow_: "ABCDEFGHJKLMNPQRSTUV",
  upscols_: ["JKLPQRSTUXYZ", "ABCFGHJKLPQR", "RSTUXYZ", "ABCFGHJ"],
  upsrows_: ["ABCDEFGHJKLMNPQRSTUVWXYZ", "ABCDEFGHJKLMNP"],
  latband_: "CDEFGHJKLMNPQRSTUVWX",
  upsband_: "ABYZ",
  digits_: "0123456789",
  alpha_: "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz",

  base_: 10,
  tilelevel_: 5,
  utmrowperiod_: 20,
  utmevenrowshift_: 5,
  maxprec_: 5 + 6,
  mult_: 1000000,

  tile_: 100000,
  minutmcol_: 1,
  maxutmcol_: 9,
  minutmSrow_: 10,
  maxutmSrow_: 100,
  minutmNrow_: 0,
  maxutmNrow_: 95,
  minupsSind_: 8,
  maxupsSind_: 32,
  minupsNind_: 13,
  maxupsNind_: 27,
  upseasting_: 20,
  utmeasting_: 5,
};

// Difference between S hemisphere northing and N hemisphere northing
SHARED_MGRS.utmNshift_ =
  (SHARED_MGRS.maxutmSrow_ - SHARED_MGRS.minutmNrow_) * SHARED_MGRS.tile_;
SHARED_MGRS.mineasting_ = [
  SHARED_MGRS.minupsSind_,
  SHARED_MGRS.minupsNind_,
  SHARED_MGRS.minutmcol_,
  SHARED_MGRS.minutmcol_,
];
SHARED_MGRS.maxeasting_ = [
  SHARED_MGRS.maxupsSind_,
  SHARED_MGRS.maxupsNind_,
  SHARED_MGRS.maxutmcol_,
  SHARED_MGRS.maxutmcol_,
];
SHARED_MGRS.minnorthing_ = [
  SHARED_MGRS.minupsSind_,
  SHARED_MGRS.minupsNind_,
  SHARED_MGRS.minutmSrow_,
  SHARED_MGRS.minutmSrow_ - (SHARED_MGRS.maxutmSrow_ - SHARED_MGRS.minutmNrow_),
];
SHARED_MGRS.maxnorthing_ = [
  SHARED_MGRS.maxupsSind_,
  SHARED_MGRS.maxupsNind_,
  SHARED_MGRS.maxutmNrow_ + (SHARED_MGRS.maxutmSrow_ - SHARED_MGRS.minutmNrow_),
  SHARED_MGRS.maxutmNrow_,
];

// UTMUPS.standardZone calls LatitudeBand
/**
 * Return latitude band number [-10, 10) for the given latitude (degrees).
 * The bands are reckoned to include their southern edges.
 * @param {number} lat - Latitude in degrees.
 * @returns {number} - Latitude band number.
 */
SHARED_MGRS.latitudeBand = function (lat) {
  const ilat = Math.floor(lat);
  return Math.max(-10, Math.min(9, Math.floor((ilat + 80) / 8) - 10));
};

export default SHARED_MGRS;
