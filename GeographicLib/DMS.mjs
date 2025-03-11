import MATH from "../includes/math.mjs";

class DMS {
  /**
   * Indicator for presence of hemisphere indicator (N/S/E/W) on latitudes
   * and longitudes.
   **********************************************************************/

  /**
   * No indicator present.
   * @hideinitializer
   **********************************************************************/
  static NONE = 0;
  /**
   * Latitude indicator (N/S) present.
   * @hideinitializer
   **********************************************************************/
  static LATITUDE = 1;
  /**
   * Longitude indicator (E/W) present.
   * @hideinitializer
   **********************************************************************/
  static LONGITUDE = 2;
  /**
   * Used in Encode to indicate output of an azimuth in [000, 360) with no
   * letter indicator.
   * @hideinitializer
   **********************************************************************/
  static AZIMUTH = 3;
  /**
   * Used in Encode to indicate output of a plain number.
   * @hideinitializer
   **********************************************************************/
  static NUMBER = 4;

  /**
   * Indicator for trailing units on an angle.
   **********************************************************************/

  /**
   * Trailing unit is degrees.
   * @hideinitializer
   **********************************************************************/
  static DEGREE = 0;
  /**
   * Trailing unit is arc minutes.
   * @hideinitializer
   **********************************************************************/
  static MINUTE = 1;
  /**
   * Trailing unit is arc seconds.
   * @hideinitializer
   **********************************************************************/
  static SECOND = 2;

  static hemispheres_ = "SNWE";
  static signs_ = "-+";
  static digits_ = "0123456789";
  static dmsindicators_ = "D'\":";
  static components_ = ["degrees", "minutes", "seconds"];

  static replace(s, pat, c) {
    let p = 0;
    const count = c ? 1 : 0;
    while (true) {
      p = s.indexOf(pat, p);
      if (p === -1) break;
      s = s.substring(0, p) + (c ? c : "") + s.substring(p + pat.length);
    }
    return s;
  }

  static Decode(dms, ind) {
    let dmsa = dms;
    dmsa = this.replace(dmsa, "\xc2\xb0", "d"); // U+00b0 degree symbol
    dmsa = this.replace(dmsa, "\xc2\xba", "d"); // U+00ba alt symbol
    dmsa = this.replace(dmsa, "\xe2\x81\xb0", "d"); // U+2070 sup zero
    dmsa = this.replace(dmsa, "\xcb\x9a", "d"); // U+02da ring above
    dmsa = this.replace(dmsa, "\xe2\x88\x98", "d"); // U+2218 compose function

    dmsa = this.replace(dmsa, "\xe2\x80\xb2", "'"); // U+2032 prime
    dmsa = this.replace(dmsa, "\xe2\x80\xb5", "'"); // U+2035 back prime
    dmsa = this.replace(dmsa, "\xc2\xb4", "'"); // U+00b4 acute accent
    dmsa = this.replace(dmsa, "\xe2\x80\x98", "'"); // U+2018 left single quote
    dmsa = this.replace(dmsa, "\xe2\x80\x99", "'"); // U+2019 right single quote
    dmsa = this.replace(dmsa, "\xe2\x80\x9b", "'"); // U+201b reversed-9 single quote
    dmsa = this.replace(dmsa, "\xca\xb9", "'"); // U+02b9 modifier letter prime
    dmsa = this.replace(dmsa, "\xcb\x8a", "'"); // U+02ca modifier letter acute accent
    dmsa = this.replace(dmsa, "\xcb\x8b", "'"); // U+02cb modifier letter grave accent

    dmsa = this.replace(dmsa, "\xe2\x80\xb3", '"'); // U+2033 double prime
    dmsa = this.replace(dmsa, "\xe2\x80\xb6", '"'); // U+2036 reversed double prime
    dmsa = this.replace(dmsa, "\xcb\x9d", '"'); // U+02dd double acute accent
    dmsa = this.replace(dmsa, "\xe2\x80\x9c", '"'); // U+201c left double quote
    dmsa = this.replace(dmsa, "\xe2\x80\x9d", '"'); // U+201d right double quote
    dmsa = this.replace(dmsa, "\xe2\x80\x9f", '"'); // U+201f reversed-9 double quote
    dmsa = this.replace(dmsa, "\xca\xba", '"'); // U+02ba modifier letter double prime

    dmsa = this.replace(dmsa, "\xe2\x9e\x95", "+"); // U+2795 heavy plus
    dmsa = this.replace(dmsa, "\xe2\x81\xa4", "+"); // U+2064 invisible plus

    dmsa = this.replace(dmsa, "\xe2\x80\x90", "-"); // U+2010 dash
    dmsa = this.replace(dmsa, "\xe2\x80\x91", "-"); // U+2011 non-breaking hyphen
    dmsa = this.replace(dmsa, "\xe2\x80\x93", "-"); // U+2013 en dash
    dmsa = this.replace(dmsa, "\xe2\x80\x94", "-"); // U+2014 em dash
    dmsa = this.replace(dmsa, "\xe2\x88\x92", "-"); // U+2212 minus sign
    dmsa = this.replace(dmsa, "\xe2\x9e\x96", "-"); // U+2796 heavy minus

    dmsa = this.replace(dmsa, "\xc2\xa0", ""); // U+00a0 non-breaking space
    dmsa = this.replace(dmsa, "\xe2\x80\x87", ""); // U+2007 figure space
    dmsa = this.replace(dmsa, "\xe2\x80\x89", ""); // U+2007 thin space
    dmsa = this.replace(dmsa, "\xe2\x80\x8a", ""); // U+200a hair space
    dmsa = this.replace(dmsa, "\xe2\x80\x8b", ""); // U+200b invisible space
    dmsa = this.replace(dmsa, "\xe2\x80\xaf", ""); // U+202f narrow space
    dmsa = this.replace(dmsa, "\xe2\x81\xa3", ""); // U+2063 invisible separator

    dmsa = this.replace(dmsa, "\xb0", "d"); // 0xb0 bare degree symbol
    dmsa = this.replace(dmsa, "\xba", "d"); // 0xba bare alt symbol
    dmsa = this.replace(dmsa, "*", "d"); // GRiD symbol for degree
    dmsa = this.replace(dmsa, "`", "'"); // grave accent
    dmsa = this.replace(dmsa, "\xb4", "'"); // 0xb4 bare acute accent
    dmsa = this.replace(dmsa, "\xa0", ""); // 0xa0 bare non-breaking space
    dmsa = this.replace(dmsa, "''", '"'); // '' -> "

    let beg = 0;
    let end = dmsa.length;
    while (beg < end && /\s/.test(dmsa[beg])) ++beg;
    while (beg < end && /\s/.test(dmsa[end - 1])) --end;

    let v = -0.0; // So "-0" returns -0.0
    let i = 0;
    let ind1 = this.NONE;
    for (let p = beg, pb; p < end; p = pb, ++i) {
      let pa = p;
      if (i === 0 && this.hemispheres_.includes(dmsa[pa])) ++pa;
      if (i > 0 || (pa < end && this.signs_.includes(dmsa[pa]))) ++pa;
      pb = Math.min(dmsa.indexOf(this.signs_, pa), end);
      let ind2 = this.NONE;
      v += this.InternalDecode(dmsa.substring(p, pb), ind2);
      if (ind1 === this.NONE) ind1 = ind2;
      else if (!(ind2 === this.NONE || ind1 === ind2))
        throw new Error(
          "Incompatible hemisphere specifier in " + dmsa.substring(beg, pb),
        );
    }
    if (i === 0)
      throw new Error(
        "Empty or incomplete DMS string " + dmsa.substring(beg, end),
      );
    ind = ind1;
    return v;
  }

  static InternalDecode(dmsa, ind) {
    let errormsg = "";
    do {
      let sign = 1;
      let beg = 0;
      let end = dmsa.length;
      let ind1 = this.NONE;
      let k = -1;
      if (end > beg && (k = this.hemispheres_.indexOf(dmsa[beg])) >= 0) {
        ind1 = k / 2 ? this.LONGITUDE : this.LATITUDE;
        sign = k % 2 ? 1 : -1;
        ++beg;
      }
      if (end > beg && (k = this.hemispheres_.indexOf(dmsa[end - 1])) >= 0) {
        if (k >= 0) {
          if (ind1 !== this.NONE) {
            if (dmsa[beg - 1].toUpperCase() === dmsa[end - 1].toUpperCase())
              errormsg =
                "Repeated hemisphere indicators " +
                dmsa[beg - 1] +
                " in " +
                dmsa.substring(beg - 1, end - beg + 1);
            else
              errormsg =
                "Contradictory hemisphere indicators " +
                dmsa[beg - 1] +
                " and " +
                dmsa[end - 1] +
                " in " +
                dmsa.substring(beg - 1, end - beg + 1);
            break;
          }
          ind1 = k / 2 ? this.LONGITUDE : this.LATITUDE;
          sign = k % 2 ? 1 : -1;
          --end;
        }
      }
      if (end > beg && (k = this.signs_.indexOf(dmsa[beg])) >= 0) {
        if (k >= 0) {
          sign *= k ? 1 : -1;
          ++beg;
        }
      }
      if (end === beg) {
        errormsg = "Empty or incomplete DMS string " + dmsa;
        break;
      }
      let ipieces = [0, 0, 0];
      let fpieces = [0, 0, 0];
      let npiece = 0;
      let icurrent = 0;
      let fcurrent = 0;
      let ncurrent = 0;
      let p = beg;
      let pointseen = false;
      let digcount = 0;
      let intcount = 0;
      while (p < end) {
        let x = dmsa[p++];
        if ((k = this.digits_.indexOf(x)) >= 0) {
          ++ncurrent;
          if (digcount > 0) ++digcount;
          else {
            icurrent = 10 * icurrent + k;
            ++intcount;
          }
        } else if (x === ".") {
          if (pointseen) {
            errormsg =
              "Multiple decimal points in " + dmsa.substring(beg, end - beg);
            break;
          }
          pointseen = true;
          digcount = 1;
        } else if ((k = this.dmsindicators_.indexOf(x)) >= 0) {
          if (k >= 3) {
            if (p === end) {
              errormsg =
                "Illegal for : to appear at the end of " +
                dmsa.substring(beg, end - beg);
              break;
            }
            k = npiece;
          }
          if (k === npiece - 1) {
            errormsg =
              "Repeated " +
              this.components_[k] +
              " component in " +
              dmsa.substring(beg, end - beg);
            break;
          } else if (k < npiece) {
            errormsg =
              this.components_[k] +
              " component follows " +
              this.components_[npiece - 1] +
              " component in " +
              dmsa.substring(beg, end - beg);
            break;
          }
          if (ncurrent === 0) {
            errormsg =
              "Missing numbers in " +
              this.components_[k] +
              " component of " +
              dmsa.substring(beg, end - beg);
            break;
          }
          if (digcount > 0) {
            fcurrent = parseFloat(
              dmsa.substring(p - intcount - digcount - 1, p - 1),
            );
            icurrent = 0;
          }
          ipieces[k] = icurrent;
          fpieces[k] = icurrent + fcurrent;
          if (p < end) {
            npiece = k + 1;
            icurrent = fcurrent = 0;
            ncurrent = digcount = intcount = 0;
          }
        } else if (this.signs_.includes(x)) {
          errormsg =
            "Internal sign in DMS string " + dmsa.substring(beg, end - beg);
          break;
        } else {
          errormsg =
            "Illegal character " +
            x +
            " in DMS string " +
            dmsa.substring(beg, end - beg);
          break;
        }
      }
      if (errormsg) break;
      if (!this.dmsindicators_.includes(dmsa[p - 1])) {
        if (npiece >= 3) {
          errormsg =
            "Extra text following seconds in DMS string " +
            dmsa.substring(beg, end - beg);
          break;
        }
        if (ncurrent === 0) {
          errormsg =
            "Missing numbers in trailing component of " +
            dmsa.substring(beg, end - beg);
          break;
        }
        if (digcount > 0) {
          fcurrent = parseFloat(dmsa.substring(p - intcount - digcount, p));
          icurrent = 0;
        }
        ipieces[npiece] = icurrent;
        fpieces[npiece] = icurrent + fcurrent;
      }
      if (pointseen && digcount === 0) {
        errormsg =
          "Decimal point in non-terminal component of " +
          dmsa.substring(beg, end - beg);
        break;
      }
      if (ipieces[1] >= 60 || fpieces[1] > 60) {
        errormsg = "Minutes " + fpieces[1] + " not in range [0, 60)";
        break;
      }
      if (ipieces[2] >= 60 || fpieces[2] > 60) {
        errormsg = "Seconds " + fpieces[2] + " not in range [0, 60)";
        break;
      }
      ind = ind1;
      return (
        sign *
        (fpieces[2] !== 0
          ? (60 * (60 * fpieces[0] + fpieces[1]) + fpieces[2]) / 3600
          : fpieces[1] !== 0
          ? (60 * fpieces[0] + fpieces[1]) / 60
          : fpieces[0])
      );
    } while (false);
    let val = parseFloat(dmsa);
    if (val === 0) throw new Error(errormsg);
    else ind = this.NONE;
    return val;
  }

  static DecodeLatLon(stra, strb, lat, lon, longfirst) {
    let a, b;
    let ia, ib;
    a = this.Decode(stra, ia);
    b = this.Decode(strb, ib);
    if (ia === this.NONE && ib === this.NONE) {
      ia = longfirst ? this.LONGITUDE : this.LATITUDE;
      ib = longfirst ? this.LATITUDE : this.LONGITUDE;
    } else if (ia === this.NONE)
      ia = ia === this.LATITUDE ? this.LONGITUDE : this.LATITUDE;
    else if (ib === this.NONE)
      ib = ia === this.LATITUDE ? this.LONGITUDE : this.LATITUDE;
    if (ia === ib)
      throw new Error(
        "Both " +
          stra +
          " and " +
          strb +
          " interpreted as " +
          (ia === this.LATITUDE ? "latitudes" : "longitudes"),
      );
    let lat1 = ia === this.LATITUDE ? a : b;
    let lon1 = ia === this.LATITUDE ? b : a;
    if (Math.abs(lat1) > 90)
      throw new Error("Latitude " + lat1 + "d not in [-90d, 90d]");
    lat = lat1;
    lon = lon1;
  }

  static DecodeAngle(angstr) {
    let ind;
    let ang = this.Decode(angstr, ind);
    if (ind !== this.NONE)
      throw new Error(
        "Arc angle " + angstr + " includes a hemisphere, N/E/W/S",
      );
    return ang;
  }

  static DecodeAzimuth(azistr) {
    let ind;
    let azi = this.Decode(azistr, ind);
    if (ind === this.LATITUDE)
      throw new Error("Azimuth " + azistr + " has a latitude hemisphere, N/S");
    return this.AngNormalize(azi);
  }

  static Encode(angle, trailing, prec, ind, dmssep) {
    if (ind === undefined) ind = this.NONE;
    if (dmssep === undefined) dmssep = "";
    // Assume check on range of input angle has been made by calling
    // routine (which might be able to offer a better diagnostic).
    if (!isFinite(angle)) {
      return angle < 0 ? "-inf" : angle > 0 ? "inf" : "nan";
    }

    // 15 - 2 * trailing = ceiling(log10(2^53/90/60^trailing)).
    // This suffices to give full real precision for numbers in [-90,90]
    prec = Math.min(15 + MATH.extra_digits() - 2 * trailing, prec);
    let scale =
      trailing === this.MINUTE ? 60 : trailing === this.SECOND ? 3600 : 1;
    if (ind === this.AZIMUTH) {
      angle = MATH.AngNormalize(angle);
      // Only angles strictly less than 0 can become 360; since +/-180 are
      // folded together, we convert -0 to +0 (instead of 360).
      if (angle < 0) {
        angle += 360;
      } else {
        angle = 0 + angle;
      }
    }
    let sign = Math.sign(angle);
    angle *= sign;

    // Break off integer part to preserve precision and avoid overflow in
    // manipulation of fractional part for MINUTE and SECOND
    let idegree = trailing === this.DEGREE ? 0 : Math.floor(angle);
    let fdegree = (angle - idegree) * scale;
    let s = fdegree.toFixed(prec);
    let degree, minute, second;
    switch (trailing) {
      case this.DEGREE:
        degree = s;
        break;
      default:
        let p = s.indexOf(".");
        let i;
        if (p === 0) {
          i = 0;
        } else {
          i = parseInt(s);
          if (p === -1) {
            s = "";
          } else {
            s = s.substring(p);
          }
        }
        // Now i in [0,60] or [0,3600] for MINUTE/SECOND
        switch (trailing) {
          case this.MINUTE:
            minute = (i % 60) + s;
            i = Math.floor(i / 60);
            degree = (i + idegree).toString();
            break;
          default: // case 'SECOND':
            second = (i % 60) + s;
            i = Math.floor(i / 60);
            minute = (i % 60).toString();
            i = Math.floor(i / 60);
            degree = (i + idegree).toString();
            break;
        }
        break;
    }

    // Now glue together degree+minute+second with
    // sign + zero-fill + delimiters + hemisphere
    let str = "";
    if (prec) ++prec; // Extra width for decimal point
    if (ind === this.NONE && sign < 0) {
      str += "-";
    }
    if (trailing === this.DEGREE) {
      str += degree.padStart(1 + Math.min(ind, 2) + prec, "0");
    } else {
      str += degree.padStart(1 + Math.min(ind, 2), "0");
    }
    switch (trailing) {
      case this.DEGREE:
        // Don't include degree designator (d) if it is the trailing component.
        break;
      case this.MINUTE:
        str +=
          (dmssep ? dmssep : this.dmsindicators_[0].toLowerCase()) +
          minute.padStart(2 + prec, "0");
        if (!dmssep) {
          str += this.dmsindicators_[1].toLowerCase();
        }
        break;
      default: // case 'SECOND':
        str +=
          (dmssep ? dmssep : this.dmsindicators_[0].toLowerCase()) +
          minute.padStart(2, "0") +
          (dmssep ? dmssep : this.dmsindicators_[1].toLowerCase()) +
          second.padStart(2 + prec, "0");
        if (!dmssep) {
          str += this.dmsindicators_[2].toLowerCase();
        }
        break;
    }
    if (ind !== this.NONE && ind !== this.AZIMUTH) {
      str +=
        this.hemispheres_[(ind === this.LATITUDE ? 0 : 2) + (sign < 0 ? 0 : 1)];
    }
    //console.log(str);
    return str;
  }
}

export default DMS;
