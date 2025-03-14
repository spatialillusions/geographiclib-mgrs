import UTMUPS from "../src/utmups.mjs";
//import UTILITY from "../src/utility.mjs";

const utmupsForward = {
  "UTMUPS Forward": [
    // lat, lon, zone, mgrslimits
    UTMUPS.Forward(83.6277742673141, -32.664336398663515, false, false),
    {
      zone: 24,
      northp: true,
      x: 578350.0433861618,
      y: 9290849.606814016,
      gamma: 6.2968363031608785,
      k: 0.9996749884047857,
    },
  ],
};

const utmupsReverse = {
  "UTMUPS Reverse": [
    // zone, northp, x, y, mgrslimits
    UTMUPS.Reverse(24, true, 578350, 9290850, false),
    //83.62778 -32.66434
    {
      lat: 83.6277742673141,
      lon: -32.664336398663515,
      gamma: 6.296836346298,
      k: 0.9996744348092954,
    },
  ],
};

export default {
  "UTMUPS Forward": utmupsForward,
  "UTMUPS Reverse": utmupsReverse,
};
