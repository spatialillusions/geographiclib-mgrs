import CONSTANTS from "./constants.mjs";
import UTILITY from "./Utility.mjs";
import MATH from "./math.mjs";

const DMS = {
  // Constants for hemisphere indicators
  hemispheres_: "NSEW",
  signs_: "+-",
  digits_: "0123456789",
  dmsindicators_: "d'\"",
  components_: ["d", "'", '"'],

  // Replace all occurrences of pat by c. If c is null, remove pat.
  replace(s, pat, c) {
    return s.split(pat).join(c || "");
  },

  // Convert angle into a DMS string (using d, ', and ") selecting the trailing component based on the precision.
  EncodeWithPrecision(angle, prec, ind = DMS.flag.NONE, dmssep = null) {
    return ind === DMS.flag.NUMBER
      ? UTILITY.str(angle, int(prec))
      : this.Encode(
          angle,
          prec < 2
            ? DMS.component.DEGREE
            : prec < 4
            ? DMS.component.MINUTE
            : DMS.component.SECOND,
          prec < 2 ? prec : prec < 4 ? prec - 2 : prec - 4,
          ind,
          dmssep,
        );
  },

  // Split angle into degrees and minutes
  EncodeDegMin(ang, d, m) {
    d.value = Math.floor(ang);
    m.value = MATH.dm * (ang - d.value);
  },

  // Split angle into degrees and minutes and seconds.
  EncodeDegMinSec(ang, d, m, s) {
    d.value = Math.floor(ang);
    ang = MATH.dm * (ang - d.value);
    m.value = Math.floor(ang);
    s.value = MATH.ms * (ang - m.value);
  },

  // Enums for flag and component
  flag: {
    NONE: 0,
    LATITUDE: 1,
    LONGITUDE: 2,
    AZIMUTH: 3,
    NUMBER: 4,
  },

  component: {
    DEGREE: 0,
    MINUTE: 1,
    SECOND: 2,
  },
};

export default DMS;
