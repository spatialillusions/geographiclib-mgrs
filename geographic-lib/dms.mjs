import MATH from "./math.mjs";

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

  /**
   * Convert a string in DMS to an angle.
   *
   * @param[in] dms string input.
   * @param[out] ind a DMS::flag value signaling the presence of a
   *   hemisphere indicator.
   * @exception GeographicErr if \e dms is malformed (see below).
   * @return angle (degrees).
   *
   * Degrees, minutes, and seconds are indicated by the characters d, '
   * (single quote), &quot; (double quote), and these components may only be
   * given in this order.  Any (but not all) components may be omitted and
   * other symbols (e.g., the &deg; symbol for degrees and the unicode prime
   * and double prime symbols for minutes and seconds) may be substituted;
   * two single quotes can be used instead of &quot;.  The last component
   * indicator may be omitted and is assumed to be the next smallest unit
   * (thus 33d10 is interpreted as 33d10').  The final component may be a
   * decimal fraction but the non-final components must be integers.  Instead
   * of using d, ', and &quot; to indicate degrees, minutes, and seconds, :
   * (colon) may be used to <i>separate</i> these components (numbers must
   * appear before and after each colon); thus 50d30'10.3&quot; may be
   * written as 50:30:10.3, 5.5' may be written 0:5.5, and so on.  The
   * integer parts of the minutes and seconds components must be less
   * than 60.  A single leading sign is permitted.  A hemisphere designator
   * (N, E, W, S) may be added to the beginning or end of the string.  The
   * result is multiplied by the implied sign of the hemisphere designator
   * (negative for S and W).  In addition \e ind is set to DMS::LATITUDE if N
   * or S is present, to DMS::LONGITUDE if E or W is present, and to
   * DMS::NONE otherwise.  Leading and trailing whitespace is removed from
   * the string before processing.  This routine throws an error on a
   * malformed string.  No check is performed on the range of the result.
   * Examples of legal and illegal strings are
   * - <i>LEGAL</i> (all the entries on each line are equivalent)
   *   - -20.51125, 20d30'40.5&quot;S, -20&deg;30'40.5, -20d30.675,
   *     N-20d30'40.5&quot;, -20:30:40.5
   *   - 4d0'9, 4d9&quot;, 4d9'', 4:0:9, 004:00:09, 4.0025, 4.0025d, 4d0.15,
   *     04:.15
   *   - 4:59.99999999999999, 4:60.0, 4:59:59.9999999999999, 4:59:60.0, 5
   * - <i>ILLEGAL</i> (the exception thrown explains the problem)
   *   - 4d5&quot;4', 4::5, 4:5:, :4:5, 4d4.5'4&quot;, -N20.5, 1.8e2d, 4:60,
   *     4:59:60
   *
   * The decoding operation can also perform addition and subtraction
   * operations.  If the string includes <i>internal</i> signs (i.e., not at
   * the beginning nor immediately after an initial hemisphere designator),
   * then the string is split immediately before such signs and each piece is
   * decoded according to the above rules and the results added; thus
   * <code>S3-2.5+4.1N</code> is parsed as the sum of <code>S3</code>,
   * <code>-2.5</code>, <code>+4.1N</code>.  Any piece can include a
   * hemisphere designator; however, if multiple designators are given, they
   * must compatible; e.g., you cannot mix N and E.  In addition, the
   * designator can appear at the beginning or end of the first piece, but
   * must be at the end of all subsequent pieces (a hemisphere designator is
   * not allowed after the initial sign).  Examples of legal and illegal
   * combinations are
   * - <i>LEGAL</i> (these are all equivalent)
   *   - -070:00:45, 70:01:15W+0:0.5, 70:01:15W-0:0:30W, W70:01:15+0:0:30E
   * - <i>ILLEGAL</i> (the exception thrown explains the problem)
   *   - 70:01:15W+0:0:15N, W70:01:15+W0:0:15
   *
   * \warning The "exponential" notation is not recognized.  Thus
   * <code>7.0E1</code> is illegal, while <code>7.0E+1</code> is parsed as
   * <code>(7.0E) + (+1)</code>, yielding the same result as
   * <code>8.0E</code>.
   *
   * \note At present, all the string handling in the C++ implementation of
   * %GeographicLib is with 8-bit characters.  The support for unicode
   * symbols for degrees, minutes, and seconds is therefore via the
   * <a href="https://en.wikipedia.org/wiki/UTF-8">UTF-8</a> encoding.  (The
   * JavaScript implementation of this class uses unicode natively, of
   * course.)
   *
   * Here is the list of Unicode symbols supported for degrees, minutes,
   * seconds, and the plus and minus signs; various symbols denoting variants
   * of a space, which may separate the components of a DMS string, are
   * removed:
   * - degrees:
   *   - d, D lower and upper case letters
   *   - U+00b0 degree symbol (&deg;)
   *   - U+00ba masculine ordinal indicator (&ordm;)
   *   - U+2070 superscript zero (⁰)
   *   - U+02da ring above (˚)
   *   - U+2218 compose function (∘)
   *   - * the <a href="https://grid.nga.mil">GRiD</a> symbol for degrees
   * - minutes:
   *   - ' apostrophe
   *   - ` grave accent
   *   - U+2032 prime (&prime;)
   *   - U+2035 back prime (‵)
   *   - U+00b4 acute accent (&acute;)
   *   - U+2018 left single quote (&lsquo;)
   *   - U+2019 right single quote (&rsquo;)
   *   - U+201b reversed-9 single quote (‛)
   *   - U+02b9 modifier letter prime (ʹ)
   *   - U+02ca modifier letter acute accent (ˊ)
   *   - U+02cb modifier letter grave accent (ˋ)
   * - seconds:
   *   - &quot; quotation mark
   *   - U+2033 double prime (&Prime;)
   *   - U+2036 reversed double prime (‶)
   *   + U+02dd double acute accent (˝)
   *   - U+201c left double quote (&ldquo;)
   *   - U+201d right double quote (&rdquo;)
   *   - U+201f reversed-9 double quote (‟)
   *   - U+02ba modifier letter double prime (ʺ)
   *   - '&thinsp;' any two consecutive symbols for minutes
   * - plus sign:
   *   - + plus
   *   - U+2795 heavy plus (➕)
   *   - U+2064 invisible plus (|⁤|)
   * - minus sign:
   *   - - hyphen
   *   - U+2010 dash (‐)
   *   - U+2011 non-breaking hyphen (‑)
   *   - U+2013 en dash (&ndash;)
   *   - U+2014 em dash (&mdash;)
   *   - U+2212 minus sign (&minus;)
   *   - U+2796 heavy minus (➖)
   * - ignored spaces:
   *   - U+00a0 non-breaking space
   *   - U+2007 figure space (| |)
   *   - U+2009 thin space (|&thinsp;|)
   *   - U+200a hair space ( | |)
   *   - U+200b invisible space (|​|)
   *   - U+202f narrow space ( | |)
   *   - U+2063 invisible separator (|⁣|)
   * .
   * The codes with a leading zero byte, e.g., U+00b0, are accepted in their
   * UTF-8 coded form 0xc2 0xb0 and as a single byte 0xb0.
   **********************************************************************/
  static Decode(dms, ind) {
    // Here's a table of the allowed characters

    // S unicode   dec  UTF-8      descripton

    // DEGREE
    // d U+0064    100  64         d
    // D U+0044     68  44         D
    // ° U+00b0    176  c2 b0      degree symbol
    // º U+00ba    186  c2 ba      alt symbol
    // ⁰ U+2070   8304  e2 81 b0   sup zero
    // ˚ U+02da    730  cb 9a      ring above
    // ∘ U+2218   8728  e2 88 98   compose function
    // * U+002a     42  2a         GRiD symbol for degrees

    // MINUTES
    // ' U+0027     39  27         apostrophe
    // ` U+0060     96  60         grave accent
    // ′ U+2032   8242  e2 80 b2   prime
    // ‵ U+2035   8245  e2 80 b5   back prime
    // ´ U+00b4    180  c2 b4      acute accent
    // ‘ U+2018   8216  e2 80 98   left single quote (also ext ASCII 0x91)
    // ’ U+2019   8217  e2 80 99   right single quote (also ext ASCII 0x92)
    // ‛ U+201b   8219  e2 80 9b   reversed-9 single quote
    // ʹ U+02b9    697  ca b9      modifier letter prime
    // ˊ U+02ca    714  cb 8a      modifier letter acute accent
    // ˋ U+02cb    715  cb 8b      modifier letter grave accent

    // SECONDS
    // " U+0022     34  22         quotation mark
    // ″ U+2033   8243  e2 80 b3   double prime
    // ‶ U+2036   8246  e2 80 b6   reversed double prime
    // ˝ U+02dd    733  cb 9d      double acute accent
    // “ U+201c   8220  e2 80 9c   left double quote (also ext ASCII 0x93)
    // ” U+201d   8221  e2 80 9d   right double quote (also ext ASCII 0x94)
    // ‟ U+201f   8223  e2 80 9f   reversed-9 double quote
    // ʺ U+02ba    698  ca ba      modifier letter double prime

    // PLUS
    // + U+002b     43  2b         plus sign
    // ➕ U+2795  10133  e2 9e 95   heavy plus
    //   U+2064   8292  e2 81 a4   invisible plus |⁤|

    // MINUS
    // - U+002d     45  2d         hyphen
    // ‐ U+2010   8208  e2 80 90   dash
    // ‑ U+2011   8209  e2 80 91   non-breaking hyphen
    // – U+2013   8211  e2 80 93   en dash (also ext ASCII 0x96)
    // — U+2014   8212  e2 80 94   em dash (also ext ASCII 0x97)
    // − U+2212   8722  e2 88 92   minus sign
    // ➖ U+2796  10134  e2 9e 96   heavy minus

    // IGNORED
    //   U+00a0    160  c2 a0      non-breaking space
    //   U+2007   8199  e2 80 87   figure space | |
    //   U+2009   8201  e2 80 89   thin space   | |
    //   U+200a   8202  e2 80 8a   hair space   | |
    //   U+200b   8203  e2 80 8b   invisible space |​|
    //   U+202f   8239  e2 80 af   narrow space | |
    //   U+2063   8291  e2 81 a3   invisible separator |⁣|
    // « U+00ab    171  c2 ab      left guillemot (for cgi-bin)
    // » U+00bb    187  c2 bb      right guillemot (for cgi-bin)
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
      // Skip over initial hemisphere letter (for i == 0)
      if (i === 0 && this.hemispheres_.includes(dmsa[pa])) ++pa;
      // Skip over initial sign (checking for it if i == 0)
      if (i > 0 || (pa < end && this.signs_.includes(dmsa[pa]))) ++pa;
      // Find next sign
      pb = dmsa.slice(pa, end).search(new RegExp(`[${this.signs_}]`));
      pb = pb === -1 ? end : pb + pa;
      let ind2 = this.NONE;
      v += this.InternalDecode(dmsa.substring(p, pb), ind2);
      if (ind1 === this.NONE) {
        ind1 = ind2;
      } else if (!(ind2 === this.NONE || ind1 === ind2)) {
        throw new Error(
          "Incompatible hemisphere specifier in " + dmsa.substring(beg, pb),
        );
      }
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
            console.log(errormsg);
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
              console.log(errormsg);
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
            console.log(errormsg);
            break;
          } else if (k < npiece) {
            errormsg =
              this.components_[k] +
              " component follows " +
              this.components_[npiece - 1] +
              " component in " +
              dmsa.substring(beg, end - beg);
            console.log(errormsg);
            break;
          }
          if (ncurrent === 0) {
            errormsg =
              "Missing numbers in " +
              this.components_[k] +
              " component of " +
              dmsa.substring(beg, end - beg);
            console.log(errormsg);
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
          console.log(errormsg);
          break;
        } else {
          errormsg =
            "Illegal character " +
            x +
            " in DMS string " +
            dmsa.substring(beg, end - beg);
          console.log(errormsg);
          break;
        }
      }
      if (errormsg) break;
      if (!this.dmsindicators_.includes(dmsa[p - 1])) {
        if (npiece >= 3) {
          errormsg =
            "Extra text following seconds in DMS string " +
            dmsa.substring(beg, end - beg);
          console.log(errormsg);
          break;
        }
        if (ncurrent === 0) {
          errormsg =
            "Missing numbers in trailing component of " +
            dmsa.substring(beg, end - beg);
          console.log(errormsg);
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
        console.log(errormsg);
        break;
      }
      if (ipieces[1] >= 60 || fpieces[1] > 60) {
        errormsg = "Minutes " + fpieces[1] + " not in range [0, 60)";
        console.log(errormsg);
        break;
      }
      if (ipieces[2] >= 60 || fpieces[2] > 60) {
        errormsg = "Seconds " + fpieces[2] + " not in range [0, 60)";
        console.log(errormsg);
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

  /**
   * Convert angle (in degrees) into a DMS string (using d, ', and &quot;).
   *
   * @param[in] angle input angle (degrees)
   * @param[in] trailing DMS::component value indicating the trailing units
   *   of the string (this component is given as a decimal number if
   *   necessary).
   * @param[in] prec the number of digits after the decimal point for the
   *   trailing component.
   * @param[in] ind DMS::flag value indicating additional formatting.
   * @param[in] dmssep if non-null, use as the DMS separator character
   *   (instead of d, ', &quot; delimiters).
   * @exception std::bad_alloc if memory for the string can't be allocated.
   * @return formatted string
   *
   * The interpretation of \e ind is as follows:
   * - ind == DMS::NONE, signed result no leading zeros on degrees except in
   *   the units place, e.g., -8d03'.
   * - ind == DMS::LATITUDE, trailing N or S hemisphere designator, no sign,
   *   pad degrees to 2 digits, e.g., 08d03'S.
   * - ind == DMS::LONGITUDE, trailing E or W hemisphere designator, no
   *   sign, pad degrees to 3 digits, e.g., 008d03'W.
   * - ind == DMS::AZIMUTH, convert to the range [0, 360&deg;), no
   *   sign, pad degrees to 3 digits, e.g., 351d57'.
   * .
   * The integer parts of the minutes and seconds components are always given
   * with 2 digits.
   **********************************************************************/
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
