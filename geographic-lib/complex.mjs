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
    return new Complex(
      this.real * other.real - this.imag * other.imag,
      this.real * other.imag + this.imag * other.real,
    );
  }

  div(other) {
    const denom = other.real * other.real + other.imag * other.imag;
    return new Complex(
      (this.real * other.real + this.imag * other.imag) / denom,
      (this.imag * other.real - this.real * other.imag) / denom,
    );
  }

  abs() {
    return Math.hypot(this.real, this.imag);
  }

  imag() {
    return this.imag;
  }

  real() {
    return this.real;
  }

  static ONE = new Complex(1, 0);
}

export default Complex;
