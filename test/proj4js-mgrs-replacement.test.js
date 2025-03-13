import MGRS from "../mgrs.mjs";
//*
// https://geographiclib.sourceforge.io/cgi-bin/GeoConvert
const toPoint = {
  MGRS: [
    MGRS.toPoint("24XWT783908", false),
    [-32.664336398663515, 83.6277742673141],
  ],
};

export default { "MGRS toPoint": toPoint };
//*/
