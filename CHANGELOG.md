# Changelog

## 1.0.7

- Preserve C++ signed-zero and angle behavior, fixing UPS antimeridian conversion and transverse Mercator symmetry.
- Restore C++ validation, explicit UPS zone selection, invalid-coordinate propagation, MGRS boundary adjustments, lowercase input and default arguments.
- Repair zone decoding, coordinate transfers, polar scale setting, prolate ellipsoid arithmetic and utility helpers.
- Add C++ reference fixtures and a reproducible differential audit; retain the existing GEOTRANS comparisons.
- `MGRS.reverse` now defaults to the cell center, and `UTMUPS.encodeZone` defaults to abbreviated hemisphere names, matching C++. Omit `setzone` or use `UTMUPS.STANDARD` for automatic zone selection; `0` selects UPS.

## 1.0.6

- Refresh compatible dependency versions and the lockfile to resolve known security advisories.
- Require Rollup 4.59.0 or later for its path-traversal security fix.

