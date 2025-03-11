// node resolves makes npm packages be included in the bundle
//import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "GeographicLib/GeoCoords.mjs",
  output: {
    file: "dist/geocoords.mjs",
    format: "module",
    //name: "SpotMap",
  },
  //plugins: [nodeResolve()],
};
