import MATH from "./math.mjs";

const infinite = x => Math.abs(x) === Infinity;
const finite = Number.isFinite;
const isnan = Number.isNaN;
const normalize = x => MATH.copysign(infinite(x) ? 1 : 0, x);

function scalbn(x, exponent) {
  // Keep the power of two itself representable, including subnormal divisors.
  while (exponent > 1023) { x *= 2 ** 1023; exponent -= 1023; }
  while (exponent < -1022) { x *= 2 ** -1022; exponent += 1022; }
  return x * 2 ** exponent;
}

class Complex {
  constructor(real, imag) {
    this.real = real;
    this.imag = imag;
  }

  add(other) {
    return new Complex(this.real + other.real, this.imag + other.imag);
  }

  sub(other) {
    return new Complex(this.real - other.real, this.imag - other.imag);
  }

  mul(other) {
    let a = this.real, b = this.imag, c = other.real, d = other.imag;
    const ac = a * c, bd = b * d, ad = a * d, bc = b * c;
    let real = ac - bd, imag = ad + bc;
    // Recover infinities obscured by 0 * infinity, as std::complex does.
    if (isnan(real) && isnan(imag)) {
      let recalc = false;
      if (infinite(a) || infinite(b)) {
        a = normalize(a); b = normalize(b);
        if (isnan(c)) c = MATH.copysign(0, c);
        if (isnan(d)) d = MATH.copysign(0, d);
        recalc = true;
      }
      if (infinite(c) || infinite(d)) {
        c = normalize(c); d = normalize(d);
        if (isnan(a)) a = MATH.copysign(0, a);
        if (isnan(b)) b = MATH.copysign(0, b);
        recalc = true;
      }
      if (!recalc && [ac, bd, ad, bc].some(infinite)) {
        if (isnan(a)) a = MATH.copysign(0, a);
        if (isnan(b)) b = MATH.copysign(0, b);
        if (isnan(c)) c = MATH.copysign(0, c);
        if (isnan(d)) d = MATH.copysign(0, d);
        recalc = true;
      }
      if (recalc) { real = Infinity * (a * c - b * d); imag = Infinity * (a * d + b * c); }
    }
    return new Complex(real, imag);
  }

  div(other) {
    let c = other.real, d = other.imag;
    const magnitude = Math.max(Math.abs(c), Math.abs(d));
    const exponent = magnitude > 0 && Number.isFinite(magnitude)
      ? Math.min(1023, Math.floor(Math.log2(magnitude))) : 0;
    c = scalbn(c, -exponent);
    d = scalbn(d, -exponent);
    const denom = c * c + d * d;
    let real, imag;
    // Smith's ratio form avoids squaring a large/small divisor and preserves
    // the signs of zero on the imaginary axis.
    if (Math.abs(c) < Math.abs(d)) {
      const ratio = c / d, divisor = c * ratio + d;
      real = scalbn((this.real * ratio + this.imag) / divisor, -exponent);
      imag = scalbn((this.imag * ratio - this.real) / divisor, -exponent);
    } else {
      const ratio = d / c, divisor = d * ratio + c;
      real = scalbn((this.imag * ratio + this.real) / divisor, -exponent);
      imag = scalbn((this.imag - this.real * ratio) / divisor, -exponent);
    }
    if (isnan(real) && isnan(imag)) {
      let a = this.real, b = this.imag;
      if (denom === 0 && (!isnan(a) || !isnan(b))) {
        real = MATH.copysign(Infinity, c) * a;
        imag = MATH.copysign(Infinity, c) * b;
      } else if ((infinite(a) || infinite(b)) && finite(c) && finite(d)) {
        a = normalize(a); b = normalize(b);
        real = Infinity * (a * c + b * d); imag = Infinity * (b * c - a * d);
      } else if ((infinite(c) || infinite(d)) && finite(a) && finite(b)) {
        c = normalize(c); d = normalize(d);
        real = 0 * (a * c + b * d); imag = 0 * (b * c - a * d);
      }
    }
    return new Complex(real, imag);
  }

  abs() {
    return Math.hypot(this.real, this.imag);
  }

  static ONE = new Complex(1, 0);
}

export default Complex;
