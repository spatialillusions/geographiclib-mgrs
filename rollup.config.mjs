// node resolves makes npm packages be included in the bundle
//import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "mgrs.mjs",
  output: {
    file: "dist/geographic-lib-mgrs.mjs",
    format: "module",
  },
};
