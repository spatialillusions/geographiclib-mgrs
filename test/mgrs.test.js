import MGRS from "../geographic-lib/mgrs.mjs";

const mgrsDecode = {
  "MGRS Decode UTM": [
    MGRS.Decode("33VVE7220287839"),
    { gridzone: "33V", block: "VE", easting: "72202", northing: "87839" },
  ],
  "MGRS Decode UPS": [
    MGRS.Decode("ZAG5206546829"),
    { gridzone: "Z", block: "AG", easting: "52065", northing: "46829" },
  ],
};
const mgrsForward = {
  "MGRS Forward precision 5": [
    MGRS.Forward(33, true, 472202, 6487839, 5),
    "33VVE7220287839",
  ],
  "MGRS Forward precision 3": [
    MGRS.Forward(33, true, 472202, 6487839, 3),
    "33VVE722878",
  ],
};

const centerPoint = true;
const cornerPoint = false;
const mgrsReverse = {
  "MGRS Reverse centerpoint": [
    MGRS.Reverse("33VVE7220287839", centerPoint),
    { zone: 33, northp: true, x: 472202.5, y: 6487839.5, prec: 5 },
  ],
  "MGRS Reverse cornerpoint": [
    MGRS.Reverse("33VVE7220287839", cornerPoint),
    { zone: 33, northp: true, x: 472202, y: 6487839, prec: 5 },
  ],
  // https://geographiclib.sourceforge.io/cgi-bin/GeoConvert
  "MGRS Reverse compare GeoConvert": [
    MGRS.Reverse("24XWT783908", centerPoint),
    // 24n 578350 9290850
    { zone: 24, northp: true, x: 578350, y: 9290850, prec: 3 },
  ],
  /*
  "MGRS Reverse compare UPS": [
    MGRS.Reverse("ZAG5206546829", centerPoint),
    // n 2052066 1946829
    { zone: 24, northp: true, x: 2052066, y: 1946829, prec: 5 },
  ],
  */
};

export default {
  "MGRS Decode:": mgrsDecode,
  "MGRS Forward": mgrsForward,
  "MGRS Reverse": mgrsReverse,
};
