// Compile against unmodified GeographicLib; see README.md in this directory.
#include <GeographicLib/Math.hpp>
#include <GeographicLib/Constants.hpp>
#include <GeographicLib/MGRS.hpp>
#include <GeographicLib/UTMUPS.hpp>
#include <GeographicLib/PolarStereographic.hpp>
#include <GeographicLib/TransverseMercator.hpp>
#include <GeographicLib/Utility.hpp>
#include <complex>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <vector>
using namespace GeographicLib;
using namespace std;
void value(double x) {
  if (isnan(x)) cout << "\"~nan\"";
  else if (isinf(x)) cout << (x < 0 ? "\"~-inf\"" : "\"~inf\"");
  else if (x == 0 && signbit(x)) cout << "\"~-0\"";
  else cout << setprecision(17) << x;
}
void value(int x) { cout << x; }
void value(bool x) { cout << (x ? "true" : "false"); }
void value(const string& x) {
  cout << '"';
  for (unsigned char c : x) {
    if (c == '"' || c == '\\') cout << '\\' << c;
    else if (c < 32) cout << "\\u" << hex << setw(4) << setfill('0') << int(c) << dec << setfill(' ');
    else cout << c;
  }
  cout << '"';
}
template<class... T> void out(T... x) {
  cout << '['; int n = 0;
  ((cout << (n++ ? "," : ""), value(x)), ...);
  cout << "]\n";
}
int main() {
  string line;
  while (getline(cin, line)) {
    istringstream in(line); string op, v; in >> op;
    vector<string> a;
    while (in >> v) {
      string decoded;
      if (v != "-") for (size_t n = 0; n < v.size(); n += 2)
        decoded += char(stoul(v.substr(n, 2), nullptr, 16));
      a.push_back(decoded);
    }
    auto d = [&](int i) { return strtod(a.at(i).c_str(), nullptr); };
    auto b = [&](int i) { return a.at(i) == "true"; };
    auto i = [&](int n) { return int(d(n)); };
    double x, y, lat, lon, gamma, k; int zone, prec; bool northp;
    string s, t, u, w;
    try {
      if (op == "forward" || op == "utmForward") {
        UTMUPS::Forward(d(0), d(1), zone, northp, x, y, gamma, k, i(2), b(3));
        if (op == "forward") { MGRS::Forward(zone, northp, x, y, d(0), i(4), s); out(s); }
        else out(zone, northp, x, y, gamma, k);
      } else if (op == "utmReverse") {
        UTMUPS::Reverse(i(0), b(1), d(2), d(3), lat, lon, gamma, k, b(4));
        out(lat, lon, gamma, k);
      } else if (op == "inverse") {
        MGRS::Reverse(a[0], zone, northp, x, y, prec);
        double step = 100000 / pow(10., prec), lat1, lon1;
        UTMUPS::Reverse(zone, northp, x - step/2, y - step/2, lat, lon);
        UTMUPS::Reverse(zone, northp, x + step/2, y + step/2, lat1, lon1);
        out(lon, lat, lon1, lat1);
      } else if (op == "toPoint" || op == "mgrsReverse") {
        MGRS::Reverse(a[0], zone, northp, x, y, prec, b(1));
        if (op == "mgrsReverse") out(zone, northp, x, y, prec);
        else { UTMUPS::Reverse(zone, northp, x, y, lat, lon); out(lon, lat); }
      } else if (op == "mgrsForward") {
        MGRS::Forward(i(0), b(1), d(2), d(3), i(4), s); out(s);
      } else if (op == "mgrsForwardLat") {
        MGRS::Forward(i(0), b(1), d(2), d(3), d(4), i(5), s); out(s);
      } else if (op == "decode") {
        MGRS::Decode(a[0], s, t, u, w); out(s, t, u, w);
      } else if (op == "check") { MGRS::Check(); out();
      } else if (op == "zone") out(UTMUPS::StandardZone(d(0), d(1), i(2)));
      else if (op == "decodeZone") { UTMUPS::DecodeZone(a[0], zone, northp); out(zone, northp); }
      else if (op == "encodeZone") out(UTMUPS::EncodeZone(i(0), b(1), b(2)));
      else if (op == "decodeEPSG") { UTMUPS::DecodeEPSG(i(0), zone, northp); out(zone, northp); }
      else if (op == "encodeEPSG") out(UTMUPS::EncodeEPSG(i(0), b(1)));
      else if (op == "transfer") { UTMUPS::Transfer(i(0), b(1), d(2), d(3), i(4), b(5), x, y, zone); out(zone, x, y); }
      else if (op == "tmForward" || op == "tmReverse" || op == "tmInit") {
        TransverseMercator tm(d(0), d(1), d(2));
        if (op == "tmForward") { tm.Forward(d(3), d(4), d(5), x, y, gamma, k); out(x, y, gamma, k); }
        else if (op == "tmReverse") { tm.Reverse(d(3), d(4), d(5), lat, lon, gamma, k); out(lat, lon, gamma, k); }
        else out();
      } else if (op == "psForward" || op == "psReverse" || op == "psScale" || op == "psInit") {
        PolarStereographic ps(d(0), d(1), d(2));
        if (op == "psInit") out();
        else if (op == "psScale") { ps.SetScale(d(3), d(4)); ps.Forward(true, d(3), 0, x, y, gamma, k); out(k); }
        else if (op == "psForward") { ps.Forward(b(3), d(4), d(5), x, y, gamma, k); out(x, y, gamma, k); }
        else { ps.Reverse(b(3), d(4), d(5), lat, lon, gamma, k); out(lat, lon, gamma, k); }
      } else if (op == "sum") { x = Math::sum(d(0), d(1), y); out(x, y); }
      else if (op == "angDiff") { x = Math::AngDiff(d(0), d(1), y); out(x, y); }
      else if (op == "angDiffPrincipal") out(Math::AngDiff(d(0), d(1)));
      else if (op == "sincosd") { Math::sincosd(d(0), x, y); out(x, y); }
      else if (op == "angNormalize") out(Math::AngNormalize(d(0)));
      else if (op == "angRound") out(Math::AngRound(d(0)));
      else if (op == "latFix") out(Math::LatFix(d(0)));
      else if (op == "sind") out(Math::sind(d(0)));
      else if (op == "cosd") out(Math::cosd(d(0)));
      else if (op == "tand") out(Math::tand(d(0)));
      else if (op == "atan2d") out(Math::atan2d(d(0), d(1)));
      else if (op == "atand") out(Math::atand(d(0)));
      else if (op == "taupf") out(Math::taupf(d(0), d(1)));
      else if (op == "tauf") out(Math::tauf(d(0), d(1)));
      else if (op == "eatanhe") out(Math::eatanhe(d(0), d(1)));
      else if (op == "remainder") out(remainder(d(0), d(1)));
      else if (op == "copysign") out(copysign(d(0), d(1)));
      else if (op == "signbit") out(signbit(d(0)));
      else if (op == "hypot3") out(Math::hypot3(d(0), d(1), d(2)));
      else if (op == "norm") { x = d(0); y = d(1); Math::norm(x, y); out(x, y); }
      else if (op == "sq") out(Math::sq(d(0)));
      else if (op == "swab") out(Math::swab(d(0)));
      else if (op == "polyval") { double p[] = {1, 2, 3, 4}; out(Math::polyval(i(0), p, d(1))); }
      else if (op == "mathConstants") out(Math::digits(), Math::digits10(), Math::extra_digits(), Math::bigendian, Math::pi(), Math::degree(), Math::NaN(), Math::infinity());
      else if (op == "set_digits") out(Math::set_digits(i(0)));
      else if (op == "utmConstants") out(UTMUPS::EquatorialRadius(), UTMUPS::Flattening(), UTMUPS::UTMShift());
      else if (op == "day") out(Utility::day(i(0), i(1), i(2), b(3)));
      else if (op == "date") { int yy, mm, dd; Utility::date(i(0), yy, mm, dd); out(yy, mm, dd); }
      else if (op == "dateFromString") { int yy, mm, dd; Utility::date(a[0], yy, mm, dd); out(yy, mm, dd); }
      else if (op == "parseLine") { bool ok = Utility::ParseLine(a[0], s, t, a[1].empty() ? 0 : a[1][0], a[2].empty() ? 0 : a[2][0]); out(ok, s, t); }
      else if (op == "trim") out(Utility::trim(a[0]));
      else if (op == "lookup") out(Utility::lookup(a[0], a[1][0]));
      else if (op == "str") out(Utility::str(d(0), i(1)));
      else if (op == "complex") {
        complex<double> z(d(0), d(1)), r(d(2), d(3));
        if (a[4] == "add") z += r; else if (a[4] == "sub") z -= r;
        else if (a[4] == "mul") z *= r; else if (a[4] == "div") z /= r;
        else if (a[4] == "abs") { out(abs(z)); continue; }
        out(z.real(), z.imag());
      } else if (op == "constants") {
        out(Constants::degree(), Constants::arcminute(), Constants::arcsecond(),
            Constants::WGS84_a(), Constants::WGS84_f(), Constants::WGS84_GM(), Constants::WGS84_omega(),
            Constants::GRS80_a(), Constants::GRS80_GM(), Constants::GRS80_omega(), Constants::GRS80_J2(),
            Constants::UTM_k0(), Constants::UPS_k0(), Constants::meter(), Constants::kilometer(),
            Constants::nauticalmile(), Constants::square_meter(), Constants::hectare(), Constants::square_kilometer(),
            Constants::square_nauticalmile(), Constants::foot(), Constants::yard(), Constants::fathom(),
            Constants::chain(), Constants::furlong(), Constants::mile(), Constants::acre(), Constants::square_mile(), Constants::surveyfoot());
      } else throw runtime_error("Unknown oracle operation " + op);
    } catch (const exception& e) { cout << "{\"error\":"; value(string(e.what())); cout << "}\n"; }
  }
}
