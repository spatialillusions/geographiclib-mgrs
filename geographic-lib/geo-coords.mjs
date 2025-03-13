import DMS from "./dms-old.mjs";
import UTMUPS from "./utmups.mjs";
import Utility from "./utility.mjs";
import MGRS from "./mgrs.mjs";

export default class GeoCoords {
  constructor() {
    this._zone = 0;
    this._northp = false;
    this._easting = 0;
    this._northing = 0;
    this._lat = 0;
    this._long = 0;
    this._gamma = 0;
    this._k = 0;
    this._alt_zone = 0;
    this._alt_easting = 0;
    this._alt_northing = 0;
  }

  Reset(s, centerp, longfirst) {
    const sa = [];
    const spaces = " \t\n\v\f\r,";
    let pos0 = 0,
      pos1;

    // Parse the input string into components
    while (pos0 !== -1) {
      pos1 = s.search(new RegExp(`[^${spaces}]`), pos0);
      if (pos1 === -1) break;
      pos0 = s.search(new RegExp(`[${spaces}]`), pos1);
      sa.push(s.substring(pos1, pos0 === -1 ? s.length : pos0));
    }

    if (sa.length === 1) {
      let prec;
      const mgrsReverse = MGRS.Reverse(sa[0], centerp);
      this._zone = mgrsReverse.zone;
      this._northp = mgrsReverse.northp;
      this._easting = mgrsReverse.x;
      this._northing = mgrsReverse.y;
      const utmupsReverse = UTMUPS.Reverse(
        this._zone,
        this._northp,
        this._easting,
        this._northing,
        this._lat,
        this._long,
        this._gamma,
        this._k,
      );

      /*
      this._lat = utmupsReverse.lat;
      this._long = utmupsReverse.lon;
      this._gamma = utmupsReverse.gamma;
      this._k = utmupsReverse.k;*/
    } else if (sa.length === 2) {
      DMS.DecodeLatLon(
        sa[0],
        sa[1],
        (this._lat = {}),
        (this._long = {}),
        longfirst,
      );
      UTMUPS.Forward(
        this._lat,
        this._long,
        (this._zone = {}),
        (this._northp = {}),
        (this._easting = {}),
        (this._northing = {}),
        (this._gamma = {}),
        (this._k = {}),
      );
    } else if (sa.length === 3) {
      let zoneind, coordind;
      if (sa[0].length > 0 && isNaN(sa[0][sa[0].length - 1])) {
        zoneind = 0;
        coordind = 1;
      } else if (sa[2].length > 0 && isNaN(sa[2][sa[2].length - 1])) {
        zoneind = 2;
        coordind = 0;
      } else {
        throw new Error(
          `Neither ${sa[0]} nor ${sa[2]} of the form UTM/UPS Zone + Hemisphere (ex: 38n, 09s, n)`,
        );
      }
      UTMUPS.DecodeZone(sa[zoneind], (this._zone = {}), (this._northp = {}));
      for (let i = 0; i < 2; ++i) {
        if (i) {
          this._northing = Utility.val(sa[coordind + i]);
        } else {
          this._easting = Utility.val(sa[coordind + i]);
        }
      }
      UTMUPS.Reverse(
        this._zone,
        this._northp,
        this._easting,
        this._northing,
        (this._lat = {}),
        (this._long = {}),
        (this._gamma = {}),
        (this._k = {}),
      );
      this.FixHemisphere();
    } else {
      throw new Error("Coordinate requires 1, 2, or 3 elements");
    }
    this.CopyToAlt();
  }

  GeoRepresentation(prec, longfirst) {
    prec = Math.max(0, Math.min(9 + Math.extra_digits(), prec) + 5);
    return `${Utility.str(
      longfirst ? this._long : this._lat,
      prec,
    )} ${Utility.str(longfirst ? this._lat : this._long, prec)}`;
  }

  DMSRepresentation(prec, longfirst, dmssep) {
    prec = Math.max(0, Math.min(10 + Math.extra_digits(), prec) + 5);
    return `${DMS.Encode(
      longfirst ? this._long : this._lat,
      prec,
      longfirst ? DMS.LONGITUDE : DMS.LATITUDE,
      dmssep,
    )} ${DMS.Encode(
      longfirst ? this._lat : this._long,
      prec,
      longfirst ? DMS.LATITUDE : DMS.LONGITUDE,
      dmssep,
    )}`;
  }

  MGRSRepresentation(prec) {
    prec = Math.max(-1, Math.min(6, prec) + 5);
    let mgrs = "";
    MGRS.Forward(
      this._zone,
      this._northp,
      this._easting,
      this._northing,
      this._lat,
      prec,
      mgrs,
    );
    return mgrs;
  }

  AltMGRSRepresentation(prec) {
    prec = Math.max(-1, Math.min(6, prec) + 5);
    let mgrs = "";
    MGRS.Forward(
      this._alt_zone,
      this._northp,
      this._alt_easting,
      this._alt_northing,
      this._lat,
      prec,
      mgrs,
    );
    return mgrs;
  }

  static UTMUPSString(zone, northp, easting, northing, prec, abbrev, utm) {
    const os = [];
    prec = Math.max(-5, Math.min(9 + Math.extra_digits(), prec));
    const scale = prec < 0 ? Math.pow(10, -prec) : 1;
    os.push(UTMUPS.EncodeZone(zone, northp, abbrev));
    os.push(" ");
    if (Number.isFinite(easting)) {
      os.push(Utility.str(easting / scale, Math.max(0, prec)));
      if (prec < 0 && Math.abs(easting / scale) > 0.5)
        os.push("0".repeat(-prec));
    } else {
      os.push("nan");
    }
    os.push(" ");
    if (Number.isFinite(northing)) {
      os.push(Utility.str(northing / scale, Math.max(0, prec)));
      if (prec < 0 && Math.abs(northing / scale) > 0.5)
        os.push("0".repeat(-prec));
    } else {
      os.push("nan");
    }
    utm.value = os.join("");
  }

  UTMUPSRepresentation(prec, abbrev) {
    let utm = "";
    GeoCoords.UTMUPSString(
      this._zone,
      this._northp,
      this._easting,
      this._northing,
      prec,
      abbrev,
      (utm = {}),
    );
    return utm;
  }

  UTMUPSRepresentationWithNorthp(northp, prec, abbrev) {
    let e, n, z;
    UTMUPS.Transfer(
      this._zone,
      this._northp,
      this._easting,
      this._northing,
      this._zone,
      northp,
      (e = {}),
      (n = {}),
      (z = {}),
    );
    let utm = "";
    GeoCoords.UTMUPSString(this._zone, northp, e, n, prec, abbrev, (utm = {}));
    return utm;
  }

  AltUTMUPSRepresentation(prec, abbrev) {
    let utm = "";
    GeoCoords.UTMUPSString(
      this._alt_zone,
      this._northp,
      this._alt_easting,
      this._alt_northing,
      prec,
      abbrev,
      (utm = {}),
    );
    return utm;
  }

  AltUTMUPSRepresentationWithNorthp(northp, prec, abbrev) {
    let e, n, z;
    UTMUPS.Transfer(
      this._alt_zone,
      this._northp,
      this._alt_easting,
      this._alt_northing,
      this._alt_zone,
      northp,
      (e = {}),
      (n = {}),
      (z = {}),
    );
    let utm = "";
    GeoCoords.UTMUPSString(
      this._alt_zone,
      northp,
      e,
      n,
      prec,
      abbrev,
      (utm = {}),
    );
    return utm;
  }

  FixHemisphere() {
    if (
      this._lat === 0 ||
      (this._northp && this._lat >= 0) ||
      (!this._northp && this._lat < 0) ||
      isNaN(this._lat)
    )
      return;
    if (this._zone !== UTMUPS.UPS) {
      this._northing += (this._northp ? 1 : -1) * UTMUPS.UTMShift();
      this._northp = !this._northp;
    } else {
      throw new Error("Hemisphere mixup");
    }
  }

  CopyToAlt() {
    this._alt_zone = this._zone;
    this._alt_easting = this._easting;
    this._alt_northing = this._northing;
  }
}
