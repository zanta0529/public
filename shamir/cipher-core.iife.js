var CipherCore = (function (e) {
  Object.defineProperty(e, Symbol.toStringTag, { value: `Module` });
  var t = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), (e = null)), t.exports),
    n = null,
    r = null;
  function i() {
    if (n && r) return;
    ((n = Array(256)), (r = Array(256)));
    let e = 1;
    for (let t = 0; t < 255; t++) ((r[t] = e), (n[e] = t), (e <<= 1), e >= 256 && ((e ^= 29), (e &= 255)));
  }
  var a = class {
    constructor(e, t, n) {
      if (t < 2 || n < 2 || n > t || t > 255 || n > 255) throw Error(`k 和 n 必須是 2 到 255 之間的整數，且 k <= n。`);
      if (typeof e != `string`) throw Error(`秘密必須是字串。`);
      ((this.n = t), (this.k = n), (this.config = { bits: 8, maxShares: 255 }), i());
      let r = this._str2hex(e),
        a = `1` + this._hex2bin(r),
        o = this.config.bits,
        s = a.length % o;
      ((a = `0`.repeat(o - s) + a), (this.processedSecretElements = this._splitNumStringToIntArray(a, o)));
    }
    _padLeft(e, t) {
      let n = e.length % t;
      return n ? `0`.repeat(t - n) + e : e;
    }
    _str2hex(e) {
      let t = ``;
      for (let n = 0; n < e.length; n++) {
        let r = e.charCodeAt(n);
        r < 128
          ? (t += r.toString(16).padStart(2, `0`))
          : r < 2048
            ? ((t += (192 | (r >> 6)).toString(16).padStart(2, `0`)),
              (t += (128 | (r & 63)).toString(16).padStart(2, `0`)))
            : r < 55296 || r >= 57344
              ? ((t += (224 | (r >> 12)).toString(16).padStart(2, `0`)),
                (t += (128 | ((r >> 6) & 63)).toString(16).padStart(2, `0`)),
                (t += (128 | (r & 63)).toString(16).padStart(2, `0`)))
              : ((r = 65536 + (((r & 1023) << 10) | (e.charCodeAt(++n) & 1023))),
                (t += (240 | (r >> 18)).toString(16).padStart(2, `0`)),
                (t += (128 | ((r >> 12) & 63)).toString(16).padStart(2, `0`)),
                (t += (128 | ((r >> 6) & 63)).toString(16).padStart(2, `0`)),
                (t += (128 | (r & 63)).toString(16).padStart(2, `0`)));
      }
      return t;
    }
    _hex2bin(e) {
      let t = ``;
      for (let n = 0; n < e.length; n++) {
        let r = parseInt(e[n], 16);
        if (isNaN(r)) throw Error(`Invalid hex character in _hex2bin.`);
        t += r.toString(2).padStart(4, `0`);
      }
      return t;
    }
    _bin2hex(e) {
      e = this._padLeft(e, 4);
      let t = ``;
      for (let n = 0; n < e.length; n += 4) {
        let r = e.substring(n, n + 4);
        t += parseInt(r, 2).toString(16);
      }
      return t;
    }
    _hex2str(e) {
      let t = ``,
        n = 0,
        r = () => {
          if (n >= e.length) throw Error(`Incomplete UTF-8 sequence`);
          let t = parseInt(e.substring(n, n + 2), 16);
          if (((n += 2), isNaN(t))) throw Error(`Invalid hex character in hex string`);
          return t;
        };
      for (; n < e.length; ) {
        let e,
          n = r();
        if (n < 128) e = n;
        else if ((n & 224) == 192) {
          let t = r();
          e = ((n & 31) << 6) | (t & 63);
        } else if ((n & 240) == 224) {
          let t = r(),
            i = r();
          e = ((n & 15) << 12) | ((t & 63) << 6) | (i & 63);
        } else if ((n & 248) == 240) {
          let t = r(),
            i = r(),
            a = r();
          e = ((n & 7) << 18) | ((t & 63) << 12) | ((i & 63) << 6) | (a & 63);
        } else throw Error(`Invalid UTF-8 sequence start byte.`);
        t += String.fromCodePoint(e);
      }
      return t;
    }
    _splitNumStringToIntArray(e, t) {
      let n = [];
      for (let r = 0; r < e.length; r += t) n.push(parseInt(e.substring(r, r + t), 2));
      return n;
    }
    _getRandomByte() {
      let e = new Uint8Array(1);
      return (window.crypto.getRandomValues(e), e[0]);
    }
    _evalPolynomialSJS(e, t) {
      let i = 0,
        a = n[e];
      for (let e = t.length - 1; e >= 0; e--) i = i === 0 ? t[e] : r[(a + n[i]) % this.config.maxShares] ^ t[e];
      return i;
    }
    generateShares() {
      let e = [];
      for (let t = 0; t < this.n; t++) e[t] = { id: t + 1, value: Array(this.processedSecretElements.length) };
      for (let t = 0; t < this.processedSecretElements.length; t++) {
        let n = [this.processedSecretElements[t]];
        for (let e = 1; e < this.k; e++) n[e] = this._getRandomByte();
        for (let r = 0; r < this.n; r++) {
          let i = e[r].id;
          e[r].value[t] = this._evalPolynomialSJS(i, n);
        }
      }
      return ((this.processedSecretElements = null), e);
    }
    _reconstructElementSJS(e, t) {
      let i = 0;
      for (let a = 0; a < this.k; a++) {
        if (t[a] === 0) continue;
        let o = n[t[a]];
        for (let t = 0; t < this.k; t++)
          a !== t && (o = (o + n[0 ^ e[t]] - n[e[a] ^ e[t]] + this.config.maxShares) % this.config.maxShares);
        i ^= r[o];
      }
      return i;
    }
    reconstructSecret(e) {
      if (e.length < this.k) throw Error(`至少需要 ${this.k} 份分割值才能重建。`);
      let t = e.slice(0, this.k),
        n = t[0].value.length;
      if (!t.every((e) => e.value.length === n)) throw Error(`所有用於重建的分割值長度必須一致。`);
      let r = ``,
        i = t.map((e) => e.id);
      for (let e = 0; e < n; e++) {
        let n = t.map((t) => t.value[e]),
          a = this._reconstructElementSJS(i, n);
        r += this._padLeft(a.toString(2), this.config.bits);
      }
      let a = r.indexOf(`1`),
        o = r.slice(a + 1),
        s = this._bin2hex(o);
      return this._hex2str(s);
    }
  };
  function o(e) {
    if (e.length >= 255) throw TypeError(`Alphabet too long`);
    let t = new Uint8Array(256);
    for (let e = 0; e < t.length; e++) t[e] = 255;
    for (let n = 0; n < e.length; n++) {
      let r = e.charAt(n),
        i = r.charCodeAt(0);
      if (t[i] !== 255) throw TypeError(r + ` is ambiguous`);
      t[i] = n;
    }
    let n = e.length,
      r = e.charAt(0),
      i = Math.log(n) / Math.log(256),
      a = Math.log(256) / Math.log(n);
    function o(t) {
      if (
        (t instanceof Uint8Array ||
          (ArrayBuffer.isView(t)
            ? (t = new Uint8Array(t.buffer, t.byteOffset, t.byteLength))
            : Array.isArray(t) && (t = Uint8Array.from(t))),
        !(t instanceof Uint8Array))
      )
        throw TypeError(`Expected Uint8Array`);
      if (t.length === 0) return ``;
      let i = 0,
        o = 0,
        s = 0,
        c = t.length;
      for (; s !== c && t[s] === 0; ) (s++, i++);
      let l = ((c - s) * a + 1) >>> 0,
        u = new Uint8Array(l);
      for (; s !== c; ) {
        let e = t[s],
          r = 0;
        for (let t = l - 1; (e !== 0 || r < o) && t !== -1; t--, r++)
          ((e += (256 * u[t]) >>> 0), (u[t] = (e % n) >>> 0), (e = (e / n) >>> 0));
        if (e !== 0) throw Error(`Non-zero carry`);
        ((o = r), s++);
      }
      let d = l - o;
      for (; d !== l && u[d] === 0; ) d++;
      let f = r.repeat(i);
      for (; d < l; ++d) f += e.charAt(u[d]);
      return f;
    }
    function s(e) {
      if (typeof e != `string`) throw TypeError(`Expected String`);
      if (e.length === 0) return new Uint8Array();
      let a = 0,
        o = 0,
        s = 0;
      for (; e[a] === r; ) (o++, a++);
      let c = ((e.length - a) * i + 1) >>> 0,
        l = new Uint8Array(c);
      for (; a < e.length; ) {
        let r = e.charCodeAt(a);
        if (r > 255) return;
        let i = t[r];
        if (i === 255) return;
        let o = 0;
        for (let e = c - 1; (i !== 0 || o < s) && e !== -1; e--, o++)
          ((i += (n * l[e]) >>> 0), (l[e] = (i % 256) >>> 0), (i = (i / 256) >>> 0));
        if (i !== 0) throw Error(`Non-zero carry`);
        ((s = o), a++);
      }
      let u = c - s;
      for (; u !== c && l[u] === 0; ) u++;
      let d = new Uint8Array(o + (c - u)),
        f = o;
      for (; u !== c; ) d[f++] = l[u++];
      return d;
    }
    function c(e) {
      let t = s(e);
      if (t) return t;
      throw Error(`Non-base` + n + ` character`);
    }
    return { encode: o, decodeUnsafe: s, decode: c };
  }
  var s = o(`123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`),
    c = t((e, t) => {
      t.exports = {};
    }),
    l = t((e, t) => {
      (function () {
        'use strict';
        var e = `input is invalid type`,
          n = typeof window == `object`,
          r = n ? window : {};
        r.JS_SHA256_NO_WINDOW && (n = !1);
        var i = !n && typeof self == `object`,
          a =
            !r.JS_SHA256_NO_NODE_JS &&
            typeof process == `object` &&
            process.versions &&
            process.versions.node &&
            process.type != `renderer`;
        a ? (r = global) : i && (r = self);
        var o = !r.JS_SHA256_NO_COMMON_JS && typeof t == `object` && t.exports,
          s = typeof define == `function` && define.amd,
          l = !r.JS_SHA256_NO_ARRAY_BUFFER && typeof ArrayBuffer < `u`,
          u = `0123456789abcdef`.split(``),
          d = [-2147483648, 8388608, 32768, 128],
          f = [24, 16, 8, 0],
          p = [
            1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080,
            310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774,
            264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808,
            3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
            1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817,
            3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
            1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479,
            3329325298,
          ],
          m = [`hex`, `array`, `digest`, `arrayBuffer`],
          h = [];
        ((r.JS_SHA256_NO_NODE_JS || !Array.isArray) &&
          (Array.isArray = function (e) {
            return Object.prototype.toString.call(e) === `[object Array]`;
          }),
          l &&
            (r.JS_SHA256_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView) &&
            (ArrayBuffer.isView = function (e) {
              return typeof e == `object` && e.buffer && e.buffer.constructor === ArrayBuffer;
            }));
        var g = function (e, t) {
            return function (n) {
              return new x(t, !0).update(n)[e]();
            };
          },
          _ = function (e) {
            var t = g(`hex`, e);
            (a && (t = v(t, e)),
              (t.create = function () {
                return new x(e);
              }),
              (t.update = function (e) {
                return t.create().update(e);
              }));
            for (var n = 0; n < m.length; ++n) {
              var r = m[n];
              t[r] = g(r, e);
            }
            return t;
          },
          v = function (t, n) {
            var i = c(),
              a = c().Buffer,
              o = n ? `sha224` : `sha256`,
              s =
                a.from && !r.JS_SHA256_NO_BUFFER_FROM
                  ? a.from
                  : function (e) {
                      return new a(e);
                    };
            return function (n) {
              if (typeof n == `string`) return i.createHash(o).update(n, `utf8`).digest(`hex`);
              if (n == null) throw Error(e);
              return (
                n.constructor === ArrayBuffer && (n = new Uint8Array(n)),
                Array.isArray(n) || ArrayBuffer.isView(n) || n.constructor === a
                  ? i.createHash(o).update(s(n)).digest(`hex`)
                  : t(n)
              );
            };
          },
          y = function (e, t) {
            return function (n, r) {
              return new S(n, t, !0).update(r)[e]();
            };
          },
          b = function (e) {
            var t = y(`hex`, e);
            ((t.create = function (t) {
              return new S(t, e);
            }),
              (t.update = function (e, n) {
                return t.create(e).update(n);
              }));
            for (var n = 0; n < m.length; ++n) {
              var r = m[n];
              t[r] = y(r, e);
            }
            return t;
          };
        function x(e, t) {
          (t
            ? ((h[0] =
                h[16] =
                h[1] =
                h[2] =
                h[3] =
                h[4] =
                h[5] =
                h[6] =
                h[7] =
                h[8] =
                h[9] =
                h[10] =
                h[11] =
                h[12] =
                h[13] =
                h[14] =
                h[15] =
                  0),
              (this.blocks = h))
            : (this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            e
              ? ((this.h0 = 3238371032),
                (this.h1 = 914150663),
                (this.h2 = 812702999),
                (this.h3 = 4144912697),
                (this.h4 = 4290775857),
                (this.h5 = 1750603025),
                (this.h6 = 1694076839),
                (this.h7 = 3204075428))
              : ((this.h0 = 1779033703),
                (this.h1 = 3144134277),
                (this.h2 = 1013904242),
                (this.h3 = 2773480762),
                (this.h4 = 1359893119),
                (this.h5 = 2600822924),
                (this.h6 = 528734635),
                (this.h7 = 1541459225)),
            (this.block = this.start = this.bytes = this.hBytes = 0),
            (this.finalized = this.hashed = !1),
            (this.first = !0),
            (this.is224 = e));
        }
        ((x.prototype.update = function (t) {
          if (!this.finalized) {
            var n,
              r = typeof t;
            if (r !== `string`) {
              if (r === `object`) {
                if (t === null) throw Error(e);
                if (l && t.constructor === ArrayBuffer) t = new Uint8Array(t);
                else if (!Array.isArray(t) && (!l || !ArrayBuffer.isView(t))) throw Error(e);
              } else throw Error(e);
              n = !0;
            }
            for (var i, a = 0, o, s = t.length, c = this.blocks; a < s; ) {
              if (
                (this.hashed &&
                  ((this.hashed = !1),
                  (c[0] = this.block),
                  (this.block =
                    c[16] =
                    c[1] =
                    c[2] =
                    c[3] =
                    c[4] =
                    c[5] =
                    c[6] =
                    c[7] =
                    c[8] =
                    c[9] =
                    c[10] =
                    c[11] =
                    c[12] =
                    c[13] =
                    c[14] =
                    c[15] =
                      0)),
                n)
              )
                for (o = this.start; a < s && o < 64; ++a) c[o >>> 2] |= t[a] << f[o++ & 3];
              else
                for (o = this.start; a < s && o < 64; ++a)
                  ((i = t.charCodeAt(a)),
                    i < 128
                      ? (c[o >>> 2] |= i << f[o++ & 3])
                      : i < 2048
                        ? ((c[o >>> 2] |= (192 | (i >>> 6)) << f[o++ & 3]),
                          (c[o >>> 2] |= (128 | (i & 63)) << f[o++ & 3]))
                        : i < 55296 || i >= 57344
                          ? ((c[o >>> 2] |= (224 | (i >>> 12)) << f[o++ & 3]),
                            (c[o >>> 2] |= (128 | ((i >>> 6) & 63)) << f[o++ & 3]),
                            (c[o >>> 2] |= (128 | (i & 63)) << f[o++ & 3]))
                          : ((i = 65536 + (((i & 1023) << 10) | (t.charCodeAt(++a) & 1023))),
                            (c[o >>> 2] |= (240 | (i >>> 18)) << f[o++ & 3]),
                            (c[o >>> 2] |= (128 | ((i >>> 12) & 63)) << f[o++ & 3]),
                            (c[o >>> 2] |= (128 | ((i >>> 6) & 63)) << f[o++ & 3]),
                            (c[o >>> 2] |= (128 | (i & 63)) << f[o++ & 3])));
              ((this.lastByteIndex = o),
                (this.bytes += o - this.start),
                o >= 64
                  ? ((this.block = c[16]), (this.start = o - 64), this.hash(), (this.hashed = !0))
                  : (this.start = o));
            }
            return (
              this.bytes > 4294967295 && ((this.hBytes += (this.bytes / 4294967296) << 0), (this.bytes %= 4294967296)),
              this
            );
          }
        }),
          (x.prototype.finalize = function () {
            if (!this.finalized) {
              this.finalized = !0;
              var e = this.blocks,
                t = this.lastByteIndex;
              ((e[16] = this.block),
                (e[t >>> 2] |= d[t & 3]),
                (this.block = e[16]),
                t >= 56 &&
                  (this.hashed || this.hash(),
                  (e[0] = this.block),
                  (e[16] =
                    e[1] =
                    e[2] =
                    e[3] =
                    e[4] =
                    e[5] =
                    e[6] =
                    e[7] =
                    e[8] =
                    e[9] =
                    e[10] =
                    e[11] =
                    e[12] =
                    e[13] =
                    e[14] =
                    e[15] =
                      0)),
                (e[14] = (this.hBytes << 3) | (this.bytes >>> 29)),
                (e[15] = this.bytes << 3),
                this.hash());
            }
          }),
          (x.prototype.hash = function () {
            var e = this.h0,
              t = this.h1,
              n = this.h2,
              r = this.h3,
              i = this.h4,
              a = this.h5,
              o = this.h6,
              s = this.h7,
              c = this.blocks,
              l,
              u,
              d,
              f,
              m,
              h,
              g,
              _,
              v,
              y,
              b;
            for (l = 16; l < 64; ++l)
              ((m = c[l - 15]),
                (u = ((m >>> 7) | (m << 25)) ^ ((m >>> 18) | (m << 14)) ^ (m >>> 3)),
                (m = c[l - 2]),
                (d = ((m >>> 17) | (m << 15)) ^ ((m >>> 19) | (m << 13)) ^ (m >>> 10)),
                (c[l] = (c[l - 16] + u + c[l - 7] + d) << 0));
            for (b = t & n, l = 0; l < 64; l += 4)
              (this.first
                ? (this.is224
                    ? ((_ = 300032), (m = c[0] - 1413257819), (s = (m - 150054599) << 0), (r = (m + 24177077) << 0))
                    : ((_ = 704751109),
                      (m = c[0] - 210244248),
                      (s = (m - 1521486534) << 0),
                      (r = (m + 143694565) << 0)),
                  (this.first = !1))
                : ((u = ((e >>> 2) | (e << 30)) ^ ((e >>> 13) | (e << 19)) ^ ((e >>> 22) | (e << 10))),
                  (d = ((i >>> 6) | (i << 26)) ^ ((i >>> 11) | (i << 21)) ^ ((i >>> 25) | (i << 7))),
                  (_ = e & t),
                  (f = _ ^ (e & n) ^ b),
                  (g = (i & a) ^ (~i & o)),
                  (m = s + d + g + p[l] + c[l]),
                  (h = u + f),
                  (s = (r + m) << 0),
                  (r = (m + h) << 0)),
                (u = ((r >>> 2) | (r << 30)) ^ ((r >>> 13) | (r << 19)) ^ ((r >>> 22) | (r << 10))),
                (d = ((s >>> 6) | (s << 26)) ^ ((s >>> 11) | (s << 21)) ^ ((s >>> 25) | (s << 7))),
                (v = r & e),
                (f = v ^ (r & t) ^ _),
                (g = (s & i) ^ (~s & a)),
                (m = o + d + g + p[l + 1] + c[l + 1]),
                (h = u + f),
                (o = (n + m) << 0),
                (n = (m + h) << 0),
                (u = ((n >>> 2) | (n << 30)) ^ ((n >>> 13) | (n << 19)) ^ ((n >>> 22) | (n << 10))),
                (d = ((o >>> 6) | (o << 26)) ^ ((o >>> 11) | (o << 21)) ^ ((o >>> 25) | (o << 7))),
                (y = n & r),
                (f = y ^ (n & e) ^ v),
                (g = (o & s) ^ (~o & i)),
                (m = a + d + g + p[l + 2] + c[l + 2]),
                (h = u + f),
                (a = (t + m) << 0),
                (t = (m + h) << 0),
                (u = ((t >>> 2) | (t << 30)) ^ ((t >>> 13) | (t << 19)) ^ ((t >>> 22) | (t << 10))),
                (d = ((a >>> 6) | (a << 26)) ^ ((a >>> 11) | (a << 21)) ^ ((a >>> 25) | (a << 7))),
                (b = t & n),
                (f = b ^ (t & r) ^ y),
                (g = (a & o) ^ (~a & s)),
                (m = i + d + g + p[l + 3] + c[l + 3]),
                (h = u + f),
                (i = (e + m) << 0),
                (e = (m + h) << 0),
                (this.chromeBugWorkAround = !0));
            ((this.h0 = (this.h0 + e) << 0),
              (this.h1 = (this.h1 + t) << 0),
              (this.h2 = (this.h2 + n) << 0),
              (this.h3 = (this.h3 + r) << 0),
              (this.h4 = (this.h4 + i) << 0),
              (this.h5 = (this.h5 + a) << 0),
              (this.h6 = (this.h6 + o) << 0),
              (this.h7 = (this.h7 + s) << 0));
          }),
          (x.prototype.hex = function () {
            this.finalize();
            var e = this.h0,
              t = this.h1,
              n = this.h2,
              r = this.h3,
              i = this.h4,
              a = this.h5,
              o = this.h6,
              s = this.h7,
              c =
                u[(e >>> 28) & 15] +
                u[(e >>> 24) & 15] +
                u[(e >>> 20) & 15] +
                u[(e >>> 16) & 15] +
                u[(e >>> 12) & 15] +
                u[(e >>> 8) & 15] +
                u[(e >>> 4) & 15] +
                u[e & 15] +
                u[(t >>> 28) & 15] +
                u[(t >>> 24) & 15] +
                u[(t >>> 20) & 15] +
                u[(t >>> 16) & 15] +
                u[(t >>> 12) & 15] +
                u[(t >>> 8) & 15] +
                u[(t >>> 4) & 15] +
                u[t & 15] +
                u[(n >>> 28) & 15] +
                u[(n >>> 24) & 15] +
                u[(n >>> 20) & 15] +
                u[(n >>> 16) & 15] +
                u[(n >>> 12) & 15] +
                u[(n >>> 8) & 15] +
                u[(n >>> 4) & 15] +
                u[n & 15] +
                u[(r >>> 28) & 15] +
                u[(r >>> 24) & 15] +
                u[(r >>> 20) & 15] +
                u[(r >>> 16) & 15] +
                u[(r >>> 12) & 15] +
                u[(r >>> 8) & 15] +
                u[(r >>> 4) & 15] +
                u[r & 15] +
                u[(i >>> 28) & 15] +
                u[(i >>> 24) & 15] +
                u[(i >>> 20) & 15] +
                u[(i >>> 16) & 15] +
                u[(i >>> 12) & 15] +
                u[(i >>> 8) & 15] +
                u[(i >>> 4) & 15] +
                u[i & 15] +
                u[(a >>> 28) & 15] +
                u[(a >>> 24) & 15] +
                u[(a >>> 20) & 15] +
                u[(a >>> 16) & 15] +
                u[(a >>> 12) & 15] +
                u[(a >>> 8) & 15] +
                u[(a >>> 4) & 15] +
                u[a & 15] +
                u[(o >>> 28) & 15] +
                u[(o >>> 24) & 15] +
                u[(o >>> 20) & 15] +
                u[(o >>> 16) & 15] +
                u[(o >>> 12) & 15] +
                u[(o >>> 8) & 15] +
                u[(o >>> 4) & 15] +
                u[o & 15];
            return (
              this.is224 ||
                (c +=
                  u[(s >>> 28) & 15] +
                  u[(s >>> 24) & 15] +
                  u[(s >>> 20) & 15] +
                  u[(s >>> 16) & 15] +
                  u[(s >>> 12) & 15] +
                  u[(s >>> 8) & 15] +
                  u[(s >>> 4) & 15] +
                  u[s & 15]),
              c
            );
          }),
          (x.prototype.toString = x.prototype.hex),
          (x.prototype.digest = function () {
            this.finalize();
            var e = this.h0,
              t = this.h1,
              n = this.h2,
              r = this.h3,
              i = this.h4,
              a = this.h5,
              o = this.h6,
              s = this.h7,
              c = [
                (e >>> 24) & 255,
                (e >>> 16) & 255,
                (e >>> 8) & 255,
                e & 255,
                (t >>> 24) & 255,
                (t >>> 16) & 255,
                (t >>> 8) & 255,
                t & 255,
                (n >>> 24) & 255,
                (n >>> 16) & 255,
                (n >>> 8) & 255,
                n & 255,
                (r >>> 24) & 255,
                (r >>> 16) & 255,
                (r >>> 8) & 255,
                r & 255,
                (i >>> 24) & 255,
                (i >>> 16) & 255,
                (i >>> 8) & 255,
                i & 255,
                (a >>> 24) & 255,
                (a >>> 16) & 255,
                (a >>> 8) & 255,
                a & 255,
                (o >>> 24) & 255,
                (o >>> 16) & 255,
                (o >>> 8) & 255,
                o & 255,
              ];
            return (this.is224 || c.push((s >>> 24) & 255, (s >>> 16) & 255, (s >>> 8) & 255, s & 255), c);
          }),
          (x.prototype.array = x.prototype.digest),
          (x.prototype.arrayBuffer = function () {
            this.finalize();
            var e = new ArrayBuffer(this.is224 ? 28 : 32),
              t = new DataView(e);
            return (
              t.setUint32(0, this.h0),
              t.setUint32(4, this.h1),
              t.setUint32(8, this.h2),
              t.setUint32(12, this.h3),
              t.setUint32(16, this.h4),
              t.setUint32(20, this.h5),
              t.setUint32(24, this.h6),
              this.is224 || t.setUint32(28, this.h7),
              e
            );
          }));
        function S(t, n, r) {
          var i,
            a = typeof t;
          if (a === `string`) {
            var o = [],
              s = t.length,
              c = 0,
              u;
            for (i = 0; i < s; ++i)
              ((u = t.charCodeAt(i)),
                u < 128
                  ? (o[c++] = u)
                  : u < 2048
                    ? ((o[c++] = 192 | (u >>> 6)), (o[c++] = 128 | (u & 63)))
                    : u < 55296 || u >= 57344
                      ? ((o[c++] = 224 | (u >>> 12)), (o[c++] = 128 | ((u >>> 6) & 63)), (o[c++] = 128 | (u & 63)))
                      : ((u = 65536 + (((u & 1023) << 10) | (t.charCodeAt(++i) & 1023))),
                        (o[c++] = 240 | (u >>> 18)),
                        (o[c++] = 128 | ((u >>> 12) & 63)),
                        (o[c++] = 128 | ((u >>> 6) & 63)),
                        (o[c++] = 128 | (u & 63))));
            t = o;
          } else if (a === `object`) {
            if (t === null) throw Error(e);
            if (l && t.constructor === ArrayBuffer) t = new Uint8Array(t);
            else if (!Array.isArray(t) && (!l || !ArrayBuffer.isView(t))) throw Error(e);
          } else throw Error(e);
          t.length > 64 && (t = new x(n, !0).update(t).array());
          var d = [],
            f = [];
          for (i = 0; i < 64; ++i) {
            var p = t[i] || 0;
            ((d[i] = 92 ^ p), (f[i] = 54 ^ p));
          }
          (x.call(this, n, r), this.update(f), (this.oKeyPad = d), (this.inner = !0), (this.sharedMemory = r));
        }
        ((S.prototype = new x()),
          (S.prototype.finalize = function () {
            if ((x.prototype.finalize.call(this), this.inner)) {
              this.inner = !1;
              var e = this.array();
              (x.call(this, this.is224, this.sharedMemory),
                this.update(this.oKeyPad),
                this.update(e),
                x.prototype.finalize.call(this));
            }
          }));
        var C = _();
        ((C.sha256 = C),
          (C.sha224 = _(!0)),
          (C.sha256.hmac = b()),
          (C.sha224.hmac = b(!0)),
          o
            ? (t.exports = C)
            : ((r.sha256 = C.sha256),
              (r.sha224 = C.sha224),
              s &&
                define(function () {
                  return C;
                })));
      })();
    })();
  function u(e, t = `base64`) {
    let n = JSON.stringify(e);
    if (t === `base58`) {
      let e = new TextEncoder().encode(n);
      return s.encode(e);
    }
    if (t === `base64`) return btoa(n);
    throw Error(`不支援的編碼類型: ${t}`);
  }
  function d(e) {
    let t;
    try {
      return ((t = atob(e)), JSON.parse(t));
    } catch {}
    try {
      let n = s.decode(e);
      return ((t = new TextDecoder().decode(n)), JSON.parse(t));
    } catch {
      throw Error(`無法解析輸入，請確認其為有效的 Base64 或 Base58Check 編碼。`);
    }
  }
  function f(e) {
    let { chk: t, ...n } = e;
    if (!t) throw Error(`缺少校驗碼 (chk) 欄位。`);
    if (t !== (0, l.sha256)(JSON.stringify(n)).substring(0, 8))
      throw Error(`Checksum 驗證失敗！此分割值可能已損毀或被竄改。`);
    return !0;
  }
  function p(e) {
    let t = (0, l.sha256)(JSON.stringify(e)).substring(0, 8);
    return { ...e, chk: t };
  }
  return (
    (e.ShamirSecretsAdapter = a),
    (e.addChecksum = p),
    (e.decodeShare = d),
    (e.encodeShare = u),
    (e.verifyChecksum = f),
    e
  );
})({});
