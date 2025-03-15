# geographiclib-mgrs

This is a JavaScript port of the MGRS functionality in GeographicLib. It is designed to be a drop in replacement for proj4js mgrs.

The main difference between this library and proj4js mgrs is the support for translating to and from UPS MGRS.

## Installation

TODO make it into a NPM package so it can be installed.

## Usage

TODO Describe how to use the library

It is basically the same as proj4js mgrs.

## Verification

The output from this library has been verified against the test data from Geotrans. In the same way as Geotrans we verify that points calculated from MGRS should be within one tenth of a second, and MGRS calculated from points should be within one meter.

This is much stricter testing than proj4js mgrs, that compares that the calculated result is within 0.0000015 from the result that Geotrans has calculated.

So even if you can see in the test results that it logs some coordinates as faild, it is just a fraction of coordinates that fails compared to Geotrans.

The library is also verified aginst output from GeographicLib C++ (TO BE DONE).

## GeographicLib

Original GeographicLib can be found at:

https://geographiclib.sourceforge.io/

It is licensed under the following MIT license:

```
The MIT License (MIT).

Copyright (c) 2008-2023, Charles Karney

```
