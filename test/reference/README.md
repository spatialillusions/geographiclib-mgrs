# GeographicLib parity review

Reviewed 2026-11-19 against these pinned sources:

- [GeographicLib C++ 48959dfc4a581ad29f76b526726a801473767c98](https://github.com/geographiclib/geographiclib/tree/48959dfc4a581ad29f76b526726a801473767c98).
- [geographiclib-js 9c4036d6242aa997e08e43a20df789e2007fbe6f](https://github.com/geographiclib/geographiclib-js/tree/9c4036d6242aa997e08e43a20df789e2007fbe6f), especially `geodesic/Math.js.in`.
- [PR #5](https://github.com/spatialillusions/geographiclib-mgrs/pull/5) and [issue #4](https://github.com/spatialillusions/geographiclib-mgrs/issues/4).

## Recommendation on PR #5

The proposed `atan2d` correction is right, but insufficient as the complete parity fix. Use a shared `copysign` helper, consistent with geographiclib-js, for the half-turn in `atan2d`. Also replace the negative-sign test in that function and all four `Math.sign` assignments in transverse Mercator with sign-bit tests. C++ uses signs of either +1 or -1, including for zero; `Math.sign` can return +0 or -0 instead.

The patch here implements that consistent approach. In particular, `toPoint("ZAJ0000011026", false)` returns longitude 180, matching C++; centered conversion remains just west of 180. The corresponding south-polar reference in the issue is also in the C++ fixtures. No coordinate-specific workaround or coordinate rounding is needed.

## Function review

Every function in `index.mjs` and `src/*.mjs` was examined. The C++ reference for each family is the same-named header/source under `include/GeographicLib` and `src`, unless indicated otherwise.

| Functions | Finding and resulting behavior |
| --- | --- |
| `math`: `atan2d`, `atand`, `signbit`, new `copysign` | Preserve quadrant and signed-zero behavior. `atan2d` uses C++'s `(atan2 / pi) * 180` evaluation order. |
| `angNormalize`, `angDiff`, `sum` | Preserve the sign at ±180 and zero. Replace plain subtraction with C++'s compensated angular difference; `angDiffWithError` exposes both outputs without changing the scalar `angDiff` interface. |
| `angRound`, `sincosd`, `sind`, `cosd`, `tand` | Restore upstream rounding near zero, exact degree argument reduction, special angles and the finite tangent limit at a pole. Direct radian trigonometry previously introduced residuals on grid boundaries. |
| `eatanhe`, `taupf`, `tauf` | Correct the arctangent sign for prolate ellipsoids; let `taupf` propagate infinities as C++ does. Newton iteration otherwise matches upstream. |
| `digits`, `set_digits`, `digits10`, `extra_digits`, `pi`, `degree`, `sq`, `norm`, `polyval`, `latFix`, `hypot3`, `NaN`, `infinity`, `swab`, endian flag | Checked for binary64 operation. `set_digits` returns the actual 53-bit precision, not the requested arbitrary precision. Other operations need no algorithm change. Byte swapping is for a JavaScript number (eight bytes). The endian flag matches this little-endian target. |
| `transverse-mercator`: `init`, `UTM`, `forward`, `reverse` | Sixth-order coefficients and Clenshaw recurrences match. Fix all four parity signs and use component-wise division for the C++ scalar division by two. Constructor validation is retained. |
| `polar-stereographic`: `init`, `UPS`, `forward`, `reverse`, `setScale` | Projection equations match. `setScale` previously ignored `forward`'s returned object, producing a NaN scale; it now reads the returned scale. |
| `UTMUPS`: `standardZone`, `forward` | Honor an explicit zone 0 instead of replacing it with the default. Correct the latitude check's accidental reference to nonexistent `Math.qd`. Norway/Svalbard rules and projection bounds match. |
| `UTMUPS.reverse`, `checkCoords` | Return the NaN output object for invalid inputs instead of `undefined`. Restore C++'s default to throw on illegal coordinates. Closed upper bounds and optional MGRS limits match. |
| `UTMUPS.transfer` | Repair lost outputs and a shadowed hemisphere variable. Return `{zone, x, y}`, apply the hemisphere northing shift, and prohibit UPS hemisphere transfers as C++ does. Optional existing `.value` output arguments are also populated. |
| `decodeZone`, `encodeZone` | Replace incomplete C++ pointer arithmetic with string parsing; accept UPS hemisphere-only and invalid specs. Default `encodeZone` to abbreviation, matching C++. `decodeZone` returns `{zone, northp}` and preserves optional `.value` outputs. |
| `decodeEPSG`, `encodeEPSG`, `centralMeridian`, `UTMShift`, `equatorialRadius`, `flattening`, zone constants and coordinate-limit arrays | EPSG mappings, constants and limits match. `decodeEPSG` additionally returns its output object while retaining `.value` outputs. |
| `MGRS.forwardKnowLattitude`, `forward`, `checkCoords` | Return and apply C++ reference-argument adjustments at upper limits and when crossing the equator. Remove the compensating equator division. Use integer truncation when extracting digits, matching C++ integer arithmetic. |
| `MGRS.reverse` | Accept lowercase letters, restore default `centerp = true`, use integer precision when diagnosing odd digits, and correct malformed diagnostics. Invalid sentinel, grid-zone-only and neighboring-band behavior match C++. |
| `MGRS.decode` | Handle references with no numeric suffix and use the upstream alphabet, excluding I/O. This remains a syntactic splitter, with the same intentionally weaker validation as C++. |
| `latitudeBand`, `approxLatitudeBand`, `UTMRow`, shared MGRS constants | Constants and formulas checked. Restore integer truncation toward zero in `UTMRow`'s base-row calculation. Every UTM block/band combination is tested in the full audit. |
| `MGRS.check` | Replace callbacks that the projection methods never invoked with actual returned-value checks. All upstream ellipsoid/coverage checks now execute. |
| `utility`: `day`, `dayWithCheck`, `date`, `dateFromString`, `gregorian` | Repair integer arithmetic and undefined output references. Match upstream's British calendar transition, 1752-09-02 to 1752-09-14, instead of an assumed 1582 transition. Return date objects; preserve string-parser `.value` outputs. |
| `trim`, `lookup`, `lookupChar`, `parseLine`, `set_digits`, `str` | Fix absent comment/delimiter handling and binary64 precision configuration. Format numeric values like C++'s real-number stream overload, including signed zero, six significant digits by default and ties-to-even at fixed precision. Integer-vs-real C++ template overload selection has no direct JavaScript equivalent. |
| `complex`: constructor, `add`, `sub`, `mul`, `div`, `abs`, `ONE` | Check against `std::complex<double>`. Repair division overflow/underflow and signed-zero behavior, plus infinity/NaN recovery in multiplication/division. Keep JavaScript `.real` and `.imag` fields; remove duplicate methods which those fields always shadowed. |
| Public `forward`, `toPoint`, `inverse` | Compose the corrected C++ operations. Stop passing boolean `false` as a zone selector. `inverse` has no direct C++ counterpart: its existing SW/NE corner calculation is tested against the corresponding C++ projections. |

## Validation and limits

- **6,201 committed C++ reference cases**, run in the normal test suite, plus adapter/default-argument contracts.
- **272,013 live C++ comparisons**, all passing. This includes all 192,000 UTM block/band combinations, all 772 UPS block combinations, both existing 16,620-row GEOTRANS datasets, deterministic random coordinates, precision -1 through 11, signed zeros, poles, antimeridians, equator crossings, bounds, invalid strings, zone/EPSG mappings and helper arithmetic.
- **1,534 shared math comparisons with geographiclib-js**, all passing within floating-point tolerance. geographiclib-js supplies the shared math reference; it does not supply this MGRS/UTMUPS implementation.
- **All 199 upstream C++ tests pass** with GCC 13.3.0 in WSL Ubuntu 24.04. These validate the reference build; they do not mean this package implements unrelated upstream geodesic/gravity functionality.
- Existing **22 tests pass**, including GEOTRANS diagnostics. Their 30 forward and 24 reverse differences remain consistent with C++; the forward mismatches must not be “fixed” by rounding projected coordinates.

Strings, booleans, zone/hemisphere/precision metadata, zeros and infinities are compared exactly. NaNs are compared by classification, not payload/sign. Exceptions are checked for whether they occur, not identical wording or C++ exception type. Numeric comparisons allow 8e-15 relative error; projection outputs additionally allow 20 nm for grid coordinates, 2e-12 degrees for geographic angles/convergence and 2e-14 for scale. See `compare.mjs` for the exact rules.

This is parity for the implemented double-precision, sixth-order projection APIs, not a claim of identical last bits for every input on every math runtime. Higher-than-meter MGRS precision can expose platform differences in the final digits when starting from geographic coordinates. Exact high-precision MGRS fixtures also test directly supplied grid coordinates. Arbitrary precision and C++'s optional exact transverse Mercator implementation are outside this port's scope.

The public `inverse` result contains two projected opposite corners. It is not guaranteed to be a tight geographic bounding box, particularly for rotated cells, polar cells or cells crossing the antimeridian. Its existing semantics are preserved; upstream has no equivalent bounding-box operation to port.

## Upstream test coverage added after the review

`upstream-cases.mjs` adds **246 source-labelled upstream cases** to both the committed fixtures and the live C++ comparison. `upstream.test.mjs` also retains **228 literal expected results** independently of fixture generation, plus three identity/output regression checks. The exact checks use `Object.is`, including signed zeros, rather than the general numerical tolerance.

| Upstream test source | Coverage in this package |
| --- | --- |
| `tests/signtest.cpp` math sections | All 42 angular-rounding boundary cases; multi-turn sine/cosine/tangent and their signs; all atan2 quadrant/zero/infinity cases; cancellation sums; angle normalization/difference; fixed-precision string rounding. Also complementary/large-angle trigonometric identities, atan2 accuracy near 180 degrees, and compensated angle-difference accuracy. |
| `tests/signtest.cpp` UTMUPS/MGRS section | Both signed equators, projected hemisphere/northing, and both MGRS forward overloads with supplied latitude +0 and -0. |
| `tests/CMakeLists.txt` GeoConvert tests | GeoConvert0, the numeric projection underlying GeoConvert1, GeoConvert7/8, and GeoConvert16–21. Some precision cases were already present; they now also have source labels and upstream literal string expectations. |
| `tests/CMakeLists.txt` transverse Mercator tests | All four series-mode cases: TransverseMercatorProj1, 3, 5 and 7. Includes pole convergence/scale, inverse quarter-meridian, and non-WGS84 Clenshaw regressions. Published decimal output is checked in addition to unrounded oracle outputs. |
| `develop/NaNTester.cpp` | All ten calls involving implemented polar stereographic and series transverse Mercator projections, including NaN central meridians, coordinates, latitudes and longitudes. All four returned fields are checked. |

The remaining registered tests exercise unimplemented APIs: DMS parsing/formatting, CLI argument handling, exact transverse Mercator, geodesics, polygon areas, intersections, other projections, gravity and magnetic models. Those tests do not apply to this MGRS port. `develop/TMTest.cpp` and `develop/ProjTest.cpp` are data-driven accuracy/timing tools rather than additional bundled fixed regression vectors; their external datasets and timing loops are not part of these tests.

## Compatibility notes

- Omit `setzone`, or pass `UTMUPS.STANDARD`, for automatic selection. `0` means UPS, including at latitudes where the standard selection would be UTM. Old calls passing `false` as the zone should be updated to omit it.
- `MGRS.reverse(ref)` now returns the center by default, as documented upstream. Pass `false` explicitly for the southwest corner.
- `UTMUPS.encodeZone(zone, northp)` now abbreviates by default. Pass `false` for the long hemisphere name.
- Illegal latitude/coordinate inputs now throw where the previous port silently accepted them. Invalid sentinels propagate NaN outputs instead of causing an incidental property-access error.
- Fixed numeric formatting uses standard ES2020 BigInt/DataView facilities; no arbitrary precision dependency is introduced.

## Reproduce

Normal tests and bundle build:

```sh
npm test
npm run build
```

Build an independent reference outside the package working tree, from the repository root (Linux/WSL example):

```sh
git clone https://github.com/geographiclib/geographiclib.git ../geographiclib-reference
git -C ../geographiclib-reference checkout 48959dfc4a581ad29f76b526726a801473767c98
cmake -S ../geographiclib-reference -B ../geographiclib-reference-build -DBUILD_SHARED_LIBS=OFF -DCMAKE_BUILD_TYPE=Release
cmake --build ../geographiclib-reference-build --target testprograms -j 8
ctest --test-dir ../geographiclib-reference-build --output-on-failure -j 8
c++ -std=c++17 -O2 -I../geographiclib-reference/include -I../geographiclib-reference-build/include test/reference/oracle.cc ../geographiclib-reference-build/src/libGeographicLib.a -o ../geographiclib-oracle
node test/reference/generate.mjs ../geographiclib-oracle
node test/reference/generate.mjs --full ../geographiclib-oracle
```

The first generation command verifies and refreshes `fixtures.json` only if all comparisons pass. The full command adds exhaustive blocks, larger random samples and the GEOTRANS input datasets without enlarging the committed fixtures. On Windows, a Linux oracle can be invoked with `--wsl /mnt/.../geographiclib-oracle`. `npm run test:cpp -- --full /path/to/oracle` is equivalent to the full generation command. Fixtures record the pinned source revision; update that metadata deliberately if changing the reference revision.
