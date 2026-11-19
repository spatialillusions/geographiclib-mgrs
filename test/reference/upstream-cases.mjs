// Ported from GeographicLib tests/signtest.cpp, tests/CMakeLists.txt and
// develop/NaNTester.cpp at 48959dfc4a581ad29f76b526726a801473767c98.
// Copyright (c) Charles Karney (2008-2022), MIT/X11; see ORIGINAL_LICENSE.
// Literal expectations retain upstream's exact binary64 and signed-zero checks.
export function upstreamCases() {
  const result = [], eps = Number.EPSILON, overflow = 1 / (eps * eps);
  const add = (source, op, args, expected) => result.push({
    source, op, args, ...(expected === undefined ? {} : { expected, exact: true }),
  });
  const sign = (op, args, expected) => add(`signtest.cpp: ${op}`, op, args, expected);

  const rounded = [
    [-eps/32, -eps/32], [-eps/64, -0], [-0, -0], [0, 0], [eps/64, 0], [eps/32, eps/32],
    [(1-2*eps)/64, (1-2*eps)/64], [(1-eps)/64, 1/64], [(1-eps/2)/64, 1/64],
    [(1-eps/4)/64, 1/64], [1/64, 1/64], [(1+eps/2)/64, 1/64],
    [(1+eps)/64, 1/64], [(1+2*eps)/64, (1+2*eps)/64],
    [(1-eps)/32, (1-eps)/32], [(1-eps/2)/32, 1/32], [(1-eps/4)/32, 1/32],
    [1/32, 1/32], [(1+eps/2)/32, 1/32], [(1+eps)/32, (1+eps)/32],
    [(1-eps)/16, (1-eps)/16], [(1-eps/2)/16, (1-eps/2)/16],
    [(1-eps/4)/16, 1/16], [1/16, 1/16], [(1+eps/4)/16, 1/16],
    [(1+eps/2)/16, 1/16], [(1+eps)/16, (1+eps)/16],
    [(1-eps)/8, (1-eps)/8], [(1-eps/2)/8, (1-eps/2)/8],
    [(1-eps/4)/8, 1/8], [(1+eps/2)/8, 1/8], [(1+eps)/8, (1+eps)/8],
    [1-eps, 1-eps], [1-eps/2, 1-eps/2], [1-eps/4, 1], [1, 1],
    [1+eps/4, 1], [1+eps/2, 1], [1+eps, 1+eps],
    [90-64*eps, 90-64*eps], [90-32*eps, 90], [90, 90],
  ];
  for (const [x, expected] of rounded) sign("angRound", [x], [expected]);

  const trigonometry = [
    [-Infinity, NaN, NaN, NaN], [-810, -1, 0, -overflow],
    [-720, -0, 1, -0], [-630, 1, 0, overflow], [-540, -0, -1, 0],
    [-450, -1, 0, -overflow], [-360, -0, 1, -0], [-270, 1, 0, overflow],
    [-180, -0, -1, 0], [-90, -1, 0, -overflow], [-0, -0, 1, -0],
    [0, 0, 1, 0], [90, 1, 0, overflow], [180, 0, -1, -0],
    [270, -1, 0, -overflow], [360, 0, 1, 0], [450, 1, 0, overflow],
    [540, 0, -1, -0], [630, -1, 0, -overflow], [720, 0, 1, 0],
    [810, 1, 0, overflow], [Infinity, NaN, NaN, NaN], [NaN, NaN, NaN, NaN],
  ];
  for (const [x, s, c, t] of trigonometry) {
    sign("sincosd", [x], [s, c]);
    sign("sind", [x], [s]); sign("cosd", [x], [c]); sign("tand", [x], [t]);
  }

  const atan = [
    [0,-0,180], [-0,-0,-180], [0,0,0], [-0,0,-0],
    [0,-1,180], [-0,-1,-180], [0,1,0], [-0,1,-0],
    [-1,0,-90], [-1,-0,-90], [1,0,90], [1,-0,90],
    [1,-Infinity,180], [-1,-Infinity,-180], [1,Infinity,0], [-1,Infinity,-0],
    [Infinity,1,90], [Infinity,-1,90], [-Infinity,1,-90], [-Infinity,-1,-90],
    [Infinity,-Infinity,135], [-Infinity,-Infinity,-135],
    [Infinity,Infinity,45], [-Infinity,Infinity,-45], [NaN,1,NaN], [1,NaN,NaN],
  ];
  for (const [y, x, expected] of atan) sign("atan2d", [y, x], [expected]);

  // Upstream checks the rounded sum; the oracle corpus also checks its residual.
  for (const [a, b] of [[9,-9], [-9,9], [-0,0], [0,-0], [-0,-0], [0,0]])
    sign("sum", [a,b], [a+b, a+b]);
  for (const [x, expected] of [
    [-900,-180], [-720,-0], [-540,-180], [-360,-0], [-180,-180], [-0,-0],
    [0,0], [180,180], [360,0], [540,180], [720,0], [900,180],
  ]) sign("angNormalize", [x], [expected]);

  // The extra error output of AngDiff is verified by the C++ oracle; these
  // literal checks below assert the principal result from upstream signtest.
  for (const [x, y, expected] of [
    [0,0,0], [0,-0,-0], [-0,0,0], [-0,-0,0], [5,365,0], [365,5,-0],
    [5,185,180], [185,5,-180], [eps,180,180], [-eps,180,-180],
    [eps,-180,180], [-eps,-180,-180], [138+128*eps,-164,58-128*eps],
  ]) add("signtest.cpp: AngDiff principal result", "angDiffPrincipal", [x,y], [expected]);

  for (const [x, expected] of [
    [NaN,"nan"], [-Infinity,"-inf"], [Infinity,"inf"], [-3.5,"-4"],
    [-2.5,"-2"], [-1.5,"-2"], [-0.5,"-0"], [-0,"-0"],
    [0,"0"], [0.5,"0"], [1.5,"2"], [2.5,"2"], [3.5,"4"],
  ]) sign("str", [x,0], [expected]);
  for (const [x, expected] of [
    [-1.75,"-1.8"], [-1.25,"-1.2"], [-0.75,"-0.8"], [-0.25,"-0.2"],
    [-0,"-0.0"], [0,"0.0"], [0.25,"0.2"], [0.75,"0.8"], [1.25,"1.2"], [1.75,"1.8"],
  ]) sign("str", [x,1], [expected]);

  for (const northp of [true, false]) {
    const lat = northp ? 0 : -0, y = northp ? 0 : 10000000;
    const expected = northp ? "31NEA0000" : "31MEV0099";
    add("signtest.cpp: UTMUPS/MGRS signed equator", "utmForward", [lat,3,-1,false]);
    add("signtest.cpp: UTMUPS/MGRS signed equator", "mgrsForward", [31,northp,500000,y,2], [expected]);
    for (const suppliedLat of [0,-0])
      add("signtest.cpp: UTMUPS/MGRS signed equator", "mgrsForwardLat", [31,northp,500000,y,suppliedLat,2], [expected]);
  }

  const f = 1000000000 / 298257223563, tm = [6378137,f,0.9996], ps = [6378137,f,0.994];
  // Series variants (-s) of the four TransverseMercatorProj regression pairs.
  add("CMakeLists.txt: TransverseMercatorProj1", "tmForward", [6378137,f,1,0,90,75]);
  add("CMakeLists.txt: TransverseMercatorProj3", "tmReverse", [6378137,f,1,0,0,10001965.7293127228]);
  add("CMakeLists.txt: TransverseMercatorProj5", "tmForward", [6400000,1/150,0.9996,0,20,30]);
  add("CMakeLists.txt: TransverseMercatorProj7", "tmReverse", [6400000,1/150,0.9996,0,3300000,2500000]);
  add("CMakeLists.txt: GeoConvert0", "forward", [33.3,44.4,-1,false,2], ["38SMB4484"]);
  add("CMakeLists.txt: GeoConvert1 numeric projection", "toPoint", ["38smb",true]);
  add("CMakeLists.txt: GeoConvert7", "check", [], []);
  add("CMakeLists.txt: GeoConvert8", "utmForward", [86,0,-1,false]);
  add("CMakeLists.txt: GeoConvert16", "mgrsForward", [38,true,444140.6,3684706.3,8], ["38SMB4414060084706300"]);
  add("CMakeLists.txt: GeoConvert17", "mgrsForward", [38,true,500000,63.811,8], ["38NNF0000000000063811"]);
  add("CMakeLists.txt: GeoConvert18", "mgrsForward", [38,true,500000,63.811,9], ["38NNF000000000000638110"]);
  for (const [prec, expected] of [[-1,"B"],[0,"BKH"],[1,"BKH41"]])
    add(`CMakeLists.txt: GeoConvert${prec+20}`, "mgrsForward", [0,false,2746000,1515000,prec], [expected]);

  // All ten calls in the implemented projection sections of NaNTester.cpp.
  add("NaNTester.cpp: polar forward latitude", "psForward", [...ps,true,NaN,30]);
  add("NaNTester.cpp: polar forward longitude", "psForward", [...ps,false,-80,NaN]);
  add("NaNTester.cpp: polar reverse easting", "psReverse", [...ps,true,NaN,0]);
  add("NaNTester.cpp: polar reverse northing", "psReverse", [...ps,false,0,NaN]);
  for (const [lon0,lat,lon] of [[0,NaN,0],[0,0,NaN],[NaN,0,0]])
    add("NaNTester.cpp: transverse forward", "tmForward", [...tm,lon0,lat,lon]);
  for (const [lon0,x,y] of [[0,NaN,0],[0,0,NaN],[NaN,0,0]])
    add("NaNTester.cpp: transverse reverse", "tmReverse", [...tm,lon0,x,y]);
  return result;
}
