import UTMUPS from "./UTMUPS.mjs";
import MATH from "../includes/math.mjs";

const MGRS = {
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
MGRS.utmNshift_ = (MGRS.maxutmSrow_ - MGRS.minutmNrow_) * MGRS.tile_;
MGRS.mineasting_ = [
  MGRS.minupsSind_,
  MGRS.minupsNind_,
  MGRS.minutmcol_,
  MGRS.minutmcol_,
];
MGRS.maxeasting_ = [
  MGRS.maxupsSind_,
  MGRS.maxupsNind_,
  MGRS.maxutmcol_,
  MGRS.maxutmcol_,
];
MGRS.minnorthing_ = [
  MGRS.minupsSind_,
  MGRS.minupsNind_,
  MGRS.minutmSrow_,
  MGRS.minutmSrow_ - (MGRS.maxutmSrow_ - MGRS.minutmNrow_),
];
MGRS.maxnorthing_ = [
  MGRS.maxupsSind_,
  MGRS.maxupsNind_,
  MGRS.maxutmNrow_ + (MGRS.maxutmSrow_ - MGRS.minutmNrow_),
  MGRS.maxutmNrow_,
];

// UTMUPS::StandardZone calls LatitudeBand
/**
 * Return latitude band number [-10, 10) for the given latitude (degrees).
 * The bands are reckoned to include their southern edges.
 * @param {number} lat - Latitude in degrees.
 * @returns {number} - Latitude band number.
 */
MGRS.LatitudeBand = function (lat) {
  const ilat = Math.floor(lat);
  return Math.max(-10, Math.min(9, Math.floor((ilat + 80) / 8) - 10));
};

/**
 * Return approximate latitude band number [-10, 10) for the given northing (meters).
 * With this rule, each 100km tile would have a unique band letter corresponding to the latitude at the center of the tile.
 * This function isn't currently used.
 * @param {number} y - Northing in meters.
 * @returns {number} - Approximate latitude band number.
 */
MGRS.ApproxLatitudeBand = function (y) {
  // northing at tile center in units of tile = 100km
  const ya = Math.floor(Math.min(88, Math.abs(y / MGRS.tile_))) + 0.5;
  // convert to lat (mult by 90/100) and then to band (divide by 8)
  // the +1 fine tunes the boundary between bands 3 and 4
  const b = Math.floor((ya * 9 + 1) / 10 / 8);
  // For the northern hemisphere we have
  // band rows  num
  // N 0   0:8    9
  // P 1   9:17   9
  // Q 2  18:26   9
  // R 3  27:34   8
  // S 4  35:43   9
  // T 5  44:52   9
  // U 6  53:61   9
  // V 7  62:70   9
  // W 8  71:79   9
  // X 9  80:94  15
  return y >= 0 ? b : -(b + 1);
};

MGRS.Forward = function (zone, northp, x, y, lat, prec) {
  const angeps = Math.pow(2, -(MATH.digits() - 7));
  if (zone === UTMUPS.INVALID || isNaN(x) || isNaN(y) || isNaN(lat)) {
    return "INVALID";
  }
  const utmp = zone !== 0;
  this.CheckCoords(utmp, northp, x, y);
  if (!(zone >= UTMUPS.MINZONE && zone <= UTMUPS.MAXZONE)) {
    throw new Error(`Zone ${zone} not in [0,60]`);
  }
  if (!(prec >= -1 && prec <= this.maxprec_)) {
    throw new Error(`MGRS precision ${prec} not in [-1, ${this.maxprec_}]`);
  }
  const mgrs1 = new Array(2 + 3 + 2 * this.maxprec_);
  let zone1 = zone - 1;
  let z = utmp ? 2 : 0;
  let mlen = z + 3 + 2 * prec;
  if (utmp) {
    mgrs1[0] = this.digits_[Math.floor(zone / this.base_)];
    mgrs1[1] = this.digits_[zone % this.base_];
  }
  const xx = x * this.mult_;
  const yy = y * this.mult_;
  const ix = Math.floor(xx);
  const iy = Math.floor(yy);
  const m = this.mult_ * this.tile_;
  const xh = Math.floor(ix / m);
  const yh = Math.floor(iy / m);
  if (utmp) {
    const iband =
      Math.abs(lat) < angeps ? (northp ? 0 : -1) : this.LatitudeBand(lat);
    let icol = xh - this.minutmcol_;
    let irow = this.UTMRow(iband, icol, yh % this.utmrowperiod_);
    if (irow !== yh - (northp ? this.minutmNrow_ : this.maxutmSrow_)) {
      throw new Error(`Latitude ${lat} is inconsistent with UTM coordinates`);
    }
    mgrs1[z++] = this.latband_[10 + iband];
    mgrs1[z++] = this.utmcols_[zone1 % 3][icol];
    mgrs1[z++] =
      this.utmrow_[
        (yh + (zone1 & 1 ? this.utmevenrowshift_ : 0)) % this.utmrowperiod_
      ];
  } else {
    const eastp = xh >= this.upseasting_;
    const iband = (northp ? 2 : 0) + (eastp ? 1 : 0);
    mgrs1[z++] = this.upsband_[iband];
    mgrs1[z++] =
      this.upscols_[iband][
        xh -
          (eastp
            ? this.upseasting_
            : northp
            ? this.minupsNind_
            : this.minupsSind_)
      ];
    mgrs1[z++] =
      this.upsrows_[northp][
        yh - (northp ? this.minupsNind_ : this.minupsSind_)
      ];
  }
  if (prec > 0) {
    ix -= m * xh;
    iy -= m * yh;
    const d = Math.pow(this.base_, this.maxprec_ - prec);
    ix /= d;
    iy /= d;
    for (let c = prec; c--; ) {
      mgrs1[z + c] = this.digits_[ix % this.base_];
      ix /= this.base_;
      mgrs1[z + c + prec] = this.digits_[iy % this.base_];
      iy /= this.base_;
    }
  }
  return mgrs1.join("").substring(0, mlen);
};
/*
MGRS.Forward = function (zone, northp, x, y, prec) {
  let lat, lon;
  if (zone > 0) {
    let ys = northp ? y : y - this.utmNshift_;
    ys /= this.tile_;
    if (Math.abs(ys) < 1) {
      lat = 0.9 * ys;
    } else {
      const latp = 0.901 * ys + (ys > 0 ? 1 : -1) * 0.135;
      const late = 0.902 * ys * (1 - 1.85e-6 * ys * ys);
      if (this.LatitudeBand(latp) === this.LatitudeBand(late)) {
        lat = latp;
      } else {
        [lat, lon] = UTMUPS.Reverse(zone, northp, x, y);
      }
    }
  } else {
    lat = 0;
  }
  return this.Forward(zone, northp, x, y, lat, prec);
};
*/
MGRS.Reverse = function (mgrs, zone, northp, easting, northing, prec, centerp) {
  let p = 0;
  const len = mgrs.length;
  if (len >= 3 && mgrs.substring(0, 3).toUpperCase() === "INV") {
    return { zone: UTMUPS.INVALID, northp: false, x: NaN, y: NaN, prec: -2 };
  }
  let zone1 = 0;
  while (p < len) {
    const i = this.digits_.indexOf(mgrs[p]);
    if (i < 0) break;
    zone1 = 10 * zone1 + i;
    ++p;
  }
  if (p > 0 && !(zone1 >= UTMUPS.MINUTMZONE && zone1 <= UTMUPS.MAXUTMZONE)) {
    throw new Error(
      `Zone ${zone1} not in [${UTMUPS.MINUTMZONE},${UTMUPS.MAXUTMZONE}]`,
    );
  }
  if (p > 2) {
    throw new Error(
      `More than 2 digits at start of MGRS ${mgrs.substring(0, p)}`,
    );
  }
  if (len - p < 1) {
    throw new Error(`MGRS string too short ${mgrs}`);
  }
  const utmp = zone1 !== UTMUPS.UPS;
  const zonem1 = zone1 - 1;
  const band = utmp ? this.latband_ : this.upsband_;
  let iband = band.indexOf(mgrs[p++]);
  if (iband < 0) {
    throw new Error(
      `Band letter ${mgrs[p - 1]} not in ${utmp ? "UTM" : "UPS"} set ${band}`,
    );
  }
  const northp1 = iband >= (utmp ? 10 : 2);
  if (p === len) {
    const deg = this.utmNshift_ / (MATH.qd * this.tile_);
    const zone = zone1;
    const northp = northp1;
    let x, y;
    if (utmp) {
      x = (zone === 31 && iband === 17 ? 4 : 5) * this.tile_;
      y =
        Math.floor(8 * (iband - 9.5) * deg + 0.5) * this.tile_ +
        (northp ? 0 : this.utmNshift_);
    } else {
      x =
        ((iband & 1 ? 1 : -1) * Math.floor(4 * deg + 0.5) + this.upseasting_) *
        this.tile_;
      y = this.upseasting_ * this.tile_;
    }
    return { zone, northp, x, y, prec: -1 };
  } else if (len - p < 2) {
    throw new Error(`Missing row letter in ${mgrs}`);
  }
  const col = utmp ? this.utmcols_[zonem1 % 3] : this.upscols_[iband];
  const row = utmp ? this.utmrow_ : this.upsrows_[northp1];
  let icol = col.indexOf(mgrs[p++]);
  if (icol < 0) {
    throw new Error(
      `Column letter ${mgrs[p - 1]} not in ${
        utmp ? "zone " + mgrs.substring(0, p - 2) : "UPS band " + mgrs[p - 2]
      } set ${col}`,
    );
  }
  let irow = row.indexOf(mgrs[p++]);
  if (irow < 0) {
    throw new Error(
      `Row letter ${mgrs[p - 1]} not in ${
        utmp ? "UTM" : "UPS " + this.hemispheres_[northp1]
      } set ${row}`,
    );
  }
  if (utmp) {
    if (zonem1 & 1) {
      irow =
        (irow + this.utmrowperiod_ - this.utmevenrowshift_) %
        this.utmrowperiod_;
    }
    iband -= 10;
    irow = this.UTMRow(iband, icol, irow);
    if (irow === this.maxutmSrow_) {
      throw new Error(
        `Block ${mgrs.substring(p - 2, 2)} not in zone/band ${mgrs.substring(
          0,
          p - 2,
        )}`,
      );
    }
    irow = northp1 ? irow : irow + 100;
    icol = icol + this.minutmcol_;
  } else {
    const eastp = iband & 1;
    icol += eastp
      ? this.upseasting_
      : northp1
      ? this.minupsNind_
      : this.minupsSind_;
    irow += northp1 ? this.minupsNind_ : this.minupsSind_;
  }
  const prec1 = (len - p) / 2;
  let unit = 1;
  let x1 = icol;
  let y1 = irow;
  for (let i = 0; i < prec1; ++i) {
    unit *= this.base_;
    const ix = this.digits_.indexOf(mgrs[p + i]);
    const iy = this.digits_.indexOf(mgrs[p + i + prec1]);
    if (ix < 0 || iy < 0) {
      throw new Error(`Encountered a non-digit in ${mgrs.substring(p)}`);
    }
    x1 = this.base_ * x1 + ix;
    y1 = this.base_ * y1 + iy;
  }
  if ((len - p) % 2) {
    if (this.digits_.indexOf(mgrs[len - 1]) < 0) {
      throw new Error(`Encountered a non-digit in ${mgrs.substring(p)}`);
    } else {
      throw new Error(`Not an even number of digits in ${mgrs.substring(p)}`);
    }
  }
  if (prec1 > this.maxprec_) {
    throw new Error(
      `More than ${2 * this.maxprec_} digits in ${mgrs.substring(p)}`,
    );
  }
  if (centerp) {
    unit *= 2;
    x1 = 2 * x1 + 1;
    y1 = 2 * y1 + 1;
  }
  zone = zone1;
  northp = northp1;
  const x = (this.tile_ * x1) / unit;
  const y = (this.tile_ * y1) / unit;
  prec = prec1;
  return { zone, northp, x, y, prec };
};

MGRS.CheckCoords = function (utmp, northp, x, y) {
  const eps = Math.pow(2, -(Math.digits() - 25));
  const ix = Math.floor(x / this.tile_);
  const iy = Math.floor(y / this.tile_);
  const ind = (utmp ? 2 : 0) + (northp ? 1 : 0);
  if (!(ix >= this.mineasting_[ind] && ix < this.maxeasting_[ind])) {
    if (
      ix === this.maxeasting_[ind] &&
      x === this.maxeasting_[ind] * this.tile_
    ) {
      x -= eps;
    } else {
      throw new Error(
        `Easting ${Math.floor(x / 1000)}km not in MGRS/${
          utmp ? "UTM" : "UPS"
        } range for ${northp ? "N" : "S"} hemisphere [${
          (this.mineasting_[ind] * this.tile_) / 1000
        }km, ${(this.maxeasting_[ind] * this.tile_) / 1000}km]`,
      );
    }
  }
  if (!(iy >= this.minnorthing_[ind] && iy < this.maxnorthing_[ind])) {
    if (
      iy === this.maxnorthing_[ind] &&
      y === this.maxnorthing_[ind] * this.tile_
    ) {
      y -= eps;
    } else {
      throw new Error(
        `Northing ${Math.floor(y / 1000)}km not in MGRS/${
          utmp ? "UTM" : "UPS"
        } range for ${northp ? "N" : "S"} hemisphere [${
          (this.minnorthing_[ind] * this.tile_) / 1000
        }km, ${(this.maxnorthing_[ind] * this.tile_) / 1000}km]`,
      );
    }
  }
  if (utmp) {
    if (northp && iy < this.minutmNrow_) {
      northp = false;
      y += this.utmNshift_;
    } else if (!northp && iy >= this.maxutmSrow_) {
      if (y === this.maxutmSrow_ * this.tile_) {
        y -= eps;
      } else {
        northp = true;
        y -= this.utmNshift_;
      }
    }
  }
};

MGRS.UTMRow = function (iband, icol, irow) {
  // Input is iband = band index in [-10, 10) (as returned by LatitudeBand),
  // icol = column index in [0,8) with origin of easting = 100km, and irow =
  // periodic row index in [0,20) with origin = equator.  Output is true row
  // index in [-90, 95).  Returns maxutmSrow_ = 100, if irow and iband are
  // incompatible.

  // Estimate center row number for latitude band
  // 90 deg = 100 tiles; 1 band = 8 deg = 100*8/90 tiles
  const c = (100 * (8 * iband + 4)) / MATH.qd;
  const northp = iband >= 0;
  // These are safe bounds on the rows
  //  iband minrow maxrow
  //   -10    -90    -81
  //    -9    -80    -72
  //    -8    -71    -63
  //    -7    -63    -54
  //    -6    -54    -45
  //    -5    -45    -36
  //    -4    -36    -27
  //    -3    -27    -18
  //    -2    -18     -9
  //    -1     -9     -1
  //     0      0      8
  //     1      8     17
  //     2     17     26
  //     3     26     35
  //     4     35     44
  //     5     44     53
  //     6     53     62
  //     7     62     70
  //     8     71     79
  //     9     80     94
  const minrow = iband > -10 ? Math.floor(c - 4.3 - 0.1 * northp) : -90;
  const maxrow = iband < 9 ? Math.floor(c + 4.4 - 0.1 * northp) : 94;
  const baserow = (minrow + maxrow) / 2 - this.utmrowperiod_ / 2;
  irow = ((irow - baserow + this.maxutmSrow_) % this.utmrowperiod_) + baserow;
  if (!(irow >= minrow && irow <= maxrow)) {
    const sband = iband >= 0 ? iband : -iband - 1;
    const srow = irow >= 0 ? irow : -irow - 1;
    const scol = icol < 4 ? icol : -icol + 7;
    if (
      !(
        (srow === 70 && sband === 8 && scol >= 2) ||
        (srow === 71 && sband === 7 && scol <= 2) ||
        (srow === 79 && sband === 9 && scol >= 1) ||
        (srow === 80 && sband === 8 && scol <= 1)
      )
    ) {
      irow = this.maxutmSrow_;
    }
  }
  return irow;
};

MGRS.Decode = function (mgrs) {
  const len = mgrs.length;
  if (len >= 3 && mgrs.substring(0, 3).toUpperCase() === "INV") {
    return {
      gridzone: mgrs.substring(0, 3),
      block: "",
      easting: "",
      northing: "",
    };
  }

  const digits = "0123456789";
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz";

  let p0 = mgrs.search(/[^0-9]/);
  if (p0 === -1) {
    throw new Error("MGRS::Decode: ref does not contain alpha chars");
  }
  if (!(p0 <= 2)) {
    throw new Error("MGRS::Decode: ref does not start with 0-2 digits");
  }

  let p1 = mgrs.search(/[^a-zA-Z]/, p0);
  if (p1 !== p0) {
    throw new Error("MGRS::Decode: ref contains non alphanumeric chars");
  }
  p1 = Math.min(mgrs.search(/[^a-zA-Z]/, p0), len);
  if (!(p1 === p0 + 1 || p1 === p0 + 3)) {
    throw new Error("MGRS::Decode: ref must contain 1 or 3 alpha chars");
  }
  if (p1 === p0 + 1 && p1 < len) {
    throw new Error("MGRS::Decode: ref contains junk after 1 alpha char");
  }
  if (
    p1 < len &&
    (mgrs.search(/[^0-9]/, p1) !== p1 || mgrs.search(/[^0-9]/, p1) !== -1)
  ) {
    throw new Error("MGRS::Decode: ref contains junk at end");
  }
  if ((len - p1) % 2 !== 0) {
    throw new Error("MGRS::Decode: ref must end with even no of digits");
  }

  return {
    gridzone: mgrs.substring(0, p0 + 1),
    block: mgrs.substring(p0 + 1, p1),
    easting: mgrs.substring(p1, p1 + (len - p1) / 2),
    northing: mgrs.substring(p1 + (len - p1) / 2),
  };
};

MGRS.Check = function () {
  let lat, lon, x, y;
  const t = this.tile_;
  let zone;
  let northp;

  UTMUPS.Reverse(31, true, 1 * t, 0 * t, (lat, lon) => {
    if (!(lon < 0)) {
      throw new Error("MGRS::Check: equator coverage failure");
    }
  });

  UTMUPS.Reverse(31, true, 1 * t, 95 * t, (lat, lon) => {
    if (!(lat > 84)) {
      throw new Error("MGRS::Check: UTM doesn't reach latitude = 84");
    }
  });

  UTMUPS.Reverse(31, false, 1 * t, 10 * t, (lat, lon) => {
    if (!(lat < -80)) {
      throw new Error("MGRS::Check: UTM doesn't reach latitude = -80");
    }
  });

  UTMUPS.Forward(
    56,
    3,
    (zone, northp, x, y) => {
      if (!(x > 1 * t)) {
        throw new Error("MGRS::Check: Norway exception creates a gap");
      }
    },
    32,
  );

  UTMUPS.Forward(
    72,
    21,
    (zone, northp, x, y) => {
      if (!(x > 1 * t)) {
        throw new Error("MGRS::Check: Svalbard exception creates a gap");
      }
    },
    35,
  );

  UTMUPS.Reverse(0, true, 20 * t, 13 * t, (lat, lon) => {
    if (!(lat < 84)) {
      throw new Error("MGRS::Check: North UPS doesn't reach latitude = 84");
    }
  });

  UTMUPS.Reverse(0, false, 20 * t, 8 * t, (lat, lon) => {
    if (!(lat > -80)) {
      throw new Error("MGRS::Check: South UPS doesn't reach latitude = -80");
    }
  });

  const tab = [
    0, 5, 0, 0, 9, 0, 0, 5, 8, 0, 9, 8, 1, 5, 9, 1, 9, 9, 1, 5, 17, 1, 9, 17, 2,
    5, 18, 2, 9, 18, 2, 5, 26, 2, 9, 26, 3, 5, 27, 3, 9, 27, 3, 5, 35, 3, 9, 35,
    4, 5, 36, 4, 9, 36, 4, 5, 44, 4, 9, 44, 5, 5, 45, 5, 9, 45, 5, 5, 53, 5, 9,
    53, 6, 5, 54, 6, 9, 54, 6, 5, 62, 6, 9, 62, 7, 5, 63, 7, 9, 63, 7, 5, 70, 7,
    7, 70, 7, 7, 71, 7, 9, 71, 8, 5, 71, 8, 6, 71, 8, 6, 72, 8, 9, 72, 8, 5, 79,
    8, 8, 79, 8, 8, 80, 8, 9, 80, 9, 5, 80, 9, 7, 80, 9, 7, 81, 9, 9, 81, 9, 5,
    95, 9, 9, 95,
  ];

  const bandchecks = tab.length / 3;
  for (let i = 0; i < bandchecks; ++i) {
    UTMUPS.Reverse(
      38,
      true,
      tab[3 * i + 1] * t,
      tab[3 * i + 2] * t,
      (lat, lon) => {
        if (!(this.LatitudeBand(lat) === tab[3 * i + 0])) {
          throw new Error(
            "MGRS::Check: Band error, b = " +
              tab[3 * i + 0] +
              ", x = " +
              tab[3 * i + 1] +
              "00km, y = " +
              tab[3 * i + 2] +
              "00km",
          );
        }
      },
    );
  }
};

export default MGRS;
