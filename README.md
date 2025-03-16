# geographiclib-mgrs

This is a JavaScript port of the MGRS functionality in GeographicLib. It is designed to be a drop in replacement for proj4js mgrs.

Differences between geographiclib-mgrs and proj4js mgrs:

- GeographicLib MGRS supports
  - UTM zones
  - UPS zones
- Proj4js MGRS supports
  - UTM zones

## Installation

TODO make it into a NPM package so it can be installed!

```
npm install geographiclib-mgrs --save
```

## Usage

TODO publish as NPM package!

```js
import MGRS from "geographiclib-mgrs";
```

to convert a MGRS string to a point

```js
const mgrs = "42SUF1230045600";
// optional variable if you want to use the center point or lower left
// default value is false
const centerpoint = false;
const point = MGRS.toPoint(mgrs, centerpoint);
// return [long, lat]
```

to convert a latlong to a MGRS string

```js
const point = [long, lat];
const accuracy = 5;
const result = MGRS.forward(point, accuracy);
// return MGRS string
```

to convert a MGRS string to a bounding box

```js
const mgrs = "42SUF123456";
// optional variable if you want to use the center point or lower left
// default value is false
const centerpoint = false;
const point = MGRS.inverse(mgrs);
// return [lowerLeft.lon, lowerLeft.lat, upperRight.lon, upperRight.lat]
```

## Verification

The output from this library has been verified against the test data from Geotrans. We use the same verification method as Geotrans and any descipances are because of rounding errors in the input data.

The library is a straight port of GeographicLib from C++ to Javascript and provides the same results as GeographicLib C++.

## Licensing

Original GeographicLib by Charles Karney can be found at:

https://geographiclib.sourceforge.io/

It is licensed under the following MIT license:

```
The MIT License (MIT).

Copyright (c) 2008-2023, Charles Karney

```

see full license text in GeographicLib source.

Geographiclib-mgrs is licensed under the following MIT license:

```
MIT License

Copyright (c) 2025 Måns Beckman

```

see full license text in the LICENSE file
