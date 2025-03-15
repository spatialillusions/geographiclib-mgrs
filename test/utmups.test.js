import UTMUPS from "../src/utmups.mjs";
//import UTILITY from "../src/utility.mjs";

//*
const utmupsForward = {
  "UTMUPS Forward": [
    // lat, lon, zone, mgrslimits
    UTMUPS.Forward(83.6277742673141, -32.664336398663515, false, false),
    {
      zone: 25,
      northp: true,
      x: 504159.22734414256,
      y: 9286552.074810686,
      gamma: 0.3335898639946378,
      k: 0.9996002113179556,
    },
  ],
};

const utmupsReverse = {
  "UTMUPS Reverse": [
    // zone, northp, x, y, mgrslimits
    UTMUPS.Reverse(25, true, 504159.22734414256, 9286552.074810686, false),
    //83.6277742673141, -32.664336398663515
    {
      lat: 83.6277742673141,
      lon: -32.664336398663515,
      gamma: 0.3335898639946357,
      k: 0.9996002113179558,
    },
  ],
};
//*/
export default {
  "UTMUPS Forward": utmupsForward,
  "UTMUPS Reverse": utmupsReverse,
};
