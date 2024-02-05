function YcgGeneral() {
    this.generalInit()
    this.renderedStatus = true;
}

YcgGeneral.prototype.generalInit = function() {
    var that = this;

    var cartUpdates = function() {
        var data = {
            action: 'ycd_woo_cart_info',
            nonce: YCD_GENERAL_ARGS.nonce
        };

        jQuery.post(YCD_GENERAL_ARGS.ajaxurl, data, function(response) {
            var id = that.options.id;
            if (!response['wooCartIsEmpty']) {
                that.rerender();
                if (jQuery('.ycd-circle-' + id + '-wrapper').is(":hidden")) {
                    jQuery('.ycd-circle-' + id + '-wrapper').show();
                }
            } else {
                jQuery('.ycd-circle-' + id + '-wrapper').hide();
            }
        });
    }
    jQuery(document).on('added_to_cart', function(event, fragments, cart_hash, $button) {
        // Perform some action here
        cartUpdates()
    });

    jQuery(document).on('removed_from_cart updated_cart_totals', function(event, fragments, cart_hash, $button) {
        // Perform some action here
        cartUpdates()
    });

    jQuery(document.body).on('wc_cart_emptied', function() {
        cartUpdates()
    });

    jQuery(document).on('removed_from_cart', function(event, cart_item_key, $cart_item) {
        // Get the current cart item count
        var item_count = parseInt(jQuery('.cart-count').text());

        // Check if the cart is now empty
        if (item_count === 0) {
            // Perform some action here
            console.log('Cart emptied');
        }
    });

    this.scrollToCountdown();
}

YcgGeneral.prototype.scrollToCountdown = function() {

    if (this.options && this.options['ycd-scroll-to-countdown']) {

        jQuery([document.documentElement, document.body]).animate({
            scrollTop: jQuery('.ycd-countdown-content-wrapper-' + this.options['id']).first().offset().top
        }, 1000);
    }
}

YcgGeneral.prototype.generalShowingLimit = function() {
    var status = true;
    var options = this.options;
    var isWoo = options['ycd-countdown-enable-woo-condition'];
    if (isWoo && options['ycd-woo-condition'] === 'cartWillNotEmpty') {
        status = !Boolean(YCD_GENERAL_ARGS['wooCartIsEmpty']);
    }

    return status;
};

YcgGeneral.prototype.allowRender = function() {
    var status = true;

    if (!this.generalShowingLimit()) {
        status = false;
    }
    this.renderedStatus = status;
    return status;
}

YcgGeneral.prototype.getSeconds = function(options) {

    var seconds = 0;
    if (this.checkWooCondition(options)) {
        return 0;
    }

    if (options['ycd-countdown-date-type'] == 'dueDate') {
        var val = options['ycd-date-time-picker'] + ':00';
        val = val.replace(/-/g, '/');
        var selectedTimezone = options['ycd-time-zone'];
        var seconds = this.setCounterTime(val, selectedTimezone);
    } else if (options['ycd-countdown-date-type'] == 'schedule') {
        var seconds = YcdCountdownProFunctionality.schedule(options);
    } else if (options['ycd-countdown-date-type'] == 'schedule2') {
        var seconds = YcdCountdownProFunctionality.schedule2(options);
    } else if (options['ycd-countdown-date-type'] == 'schedule3') {
        var seconds = YcdCountdownProFunctionality.schedule3(options);
    } else if (options['ycd-countdown-date-type'] == 'wooCoupon') {
        var val = options['ycd-woo-coupon-date'];
        val.replace('/', '-') + ' 00:00:00';
        var selectedTimezone = options['ycd-woo-time-zone'];
        var seconds = this.setCounterTime(val, selectedTimezone);
    } else {

        var seconds = this.countDurationSeconds(options);
        if (options['ycd-countdown-save-duration']) {
            if (options['ycd-countdown-save-duration-each-user']) {
                var id = options['id'];
                seconds = YcdCountdownProFunctionality.durationSeconds(seconds, options, id);
            } else {
                seconds = options['ycd-timer-seconds'];
            }
        }

        if (options['ycd-countdown-restart']) {
            if (YcdCountdownProFunctionality.checkRestartDuration(options)) {
                seconds = this.countDurationSeconds(options);
            }
        }
    }

    return seconds;
};

YcgGeneral.prototype.setCounterTime = function(calendarValue, selectedTimezone) {
    var currentDate = moment(new Date()).tz(selectedTimezone).format('MM/DD/YYYY H:m:s');
    //var currentDate = moment(new Date()).format('MM/DD/YYYY H:m:s');

    var dateTime = new Date(currentDate).valueOf();
    var timeNow = Math.floor(dateTime / 1000);
    var seconds = Math.floor(new Date(calendarValue).getTime() / 1000) - timeNow;
    if (seconds < 0) {
        seconds = 0;
    }

    return seconds;
};

YcgGeneral.prototype.countDurationSeconds = function(options) {
    var days = parseInt(options['ycd-countdown-duration-days']);
    var hours = parseInt(options['ycd-countdown-duration-hours']);
    var minutes = parseInt(options['ycd-countdown-duration-minutes']);
    var secondsSaved = parseInt(options['ycd-countdown-duration-seconds']);

    var seconds = days * 86400 + hours * 60 * 60 + minutes * 60 + secondsSaved;

    return seconds;
};

YcgGeneral.prototype.endBehavior = function(cd, options) {
    if (YCD_GENERAL_ARGS.isAdmin) {
        return false;
    }
    if (options['ycd-countdown-end-sound']) {
        var soundUrl = options['ycd-countdown-end-sound-url'];
        var song = new Audio(soundUrl);
        song.play();
    }
    var id = parseInt(options['id']);
    var behavior = options['ycd-countdown-expire-behavior'];

    jQuery(window).trigger('YcdExpired', {
        'id': id
    });

    switch (behavior) {
        case 'hideCountdown':
            cd.remove();
            break;
        case 'redirectToURL':
            cd.remove();
            window.location.href = (options['ycd-expire-url']);
            break;
        case 'showText':
            cd.replaceWith(options['ycd-expire-text']);
            break;
    }
};

YcgGeneral.prototype.checkWooCondition = function(options) {
        var isWoo = options['ycd-countdown-enable-woo-condition'];
        var initialStatus = false;
        if (!isWoo || YCD_GENERAL_ARGS.isWoo != '1') {
            return initialStatus;
        }
        var condition = options['ycd-woo-condition'];
        var productStockStatus = YCD_GENERAL_ARGS.wooStockStatus;

        if (condition === 'stockEmpty' && productStockStatus === 'outofstock') {
            return true;
        }

        if (condition === 'stockNoEmpty' && productStockStatus === 'outofstock') {
            return true;
        }
        if (typeof YcdCountdownProFunctionality.checkProWooConditions != "function") {
            return status;
        }

        return YcdCountdownProFunctionality.checkProWooConditions(initialStatus, options);
    }

    ! function(a, i) {
        "use strict";
        "object" == typeof module && module.exports ? module.exports = i(require("moment")) : "function" == typeof define && define.amd ? define(["moment"], i) : i(a.moment)
    }(this, function(c) {
        "use strict";
        void 0 === c.version && c.default && (c = c.default);
        var i, A = {},
            n = {},
            t = {},
            s = {},
            u = {};
        c && "string" == typeof c.version || y("Moment Timezone requires Moment.js. See https://momentjs.com/timezone/docs/#/use-it/browser/");
        var a = c.version.split("."),
            e = +a[0],
            r = +a[1];

        function m(a) {
            return 96 < a ? a - 87 : 64 < a ? a - 29 : a - 48
        }

        function o(a) {
            var i = 0,
                e = a.split("."),
                r = e[0],
                o = e[1] || "",
                c = 1,
                A = 0,
                n = 1;
            for (45 === a.charCodeAt(0) && (n = -(i = 1)); i < r.length; i++) A = 60 * A + m(r.charCodeAt(i));
            for (i = 0; i < o.length; i++) c /= 60, A += m(o.charCodeAt(i)) * c;
            return A * n
        }

        function f(a) {
            for (var i = 0; i < a.length; i++) a[i] = o(a[i])
        }

        function l(a, i) {
            var e, r = [];
            for (e = 0; e < i.length; e++) r[e] = a[i[e]];
            return r
        }

        function p(a) {
            var i = a.split("|"),
                e = i[2].split(" "),
                r = i[3].split(""),
                o = i[4].split(" ");
            return f(e), f(r), f(o),
                function(a, i) {
                    for (var e = 0; e < i; e++) a[e] = Math.round((a[e - 1] || 0) + 6e4 * a[e]);
                    a[i - 1] = 1 / 0
                }(o, r.length), {
                    name: i[0],
                    abbrs: l(i[1].split(" "), r),
                    offsets: l(e, r),
                    untils: o,
                    population: 0 | i[5]
                }
        }

        function M(a) {
            a && this._set(p(a))
        }

        function b(a, i) {
            this.name = a, this.zones = i
        }

        function d(a) {
            var i = a.toTimeString(),
                e = i.match(/\([a-z ]+\)/i);
            "GMT" === (e = e && e[0] ? (e = e[0].match(/[A-Z]/g)) ? e.join("") : void 0 : (e = i.match(/[A-Z]{3,5}/g)) ? e[0] : void 0) && (e = void 0), this.at = +a, this.abbr = e, this.offset = a.getTimezoneOffset()
        }

        function h(a) {
            this.zone = a, this.offsetScore = 0, this.abbrScore = 0
        }

        function g(a, i) {
            for (var e, r; r = 6e4 * ((i.at - a.at) / 12e4 | 0);)(e = new d(new Date(a.at + r))).offset === a.offset ? a = e : i = e;
            return a
        }

        function E(a, i) {
            return a.offsetScore !== i.offsetScore ? a.offsetScore - i.offsetScore : a.abbrScore !== i.abbrScore ? a.abbrScore - i.abbrScore : a.zone.population !== i.zone.population ? i.zone.population - a.zone.population : i.zone.name.localeCompare(a.zone.name)
        }

        function z(a, i) {
            var e, r;
            for (f(i), e = 0; e < i.length; e++) r = i[e], u[r] = u[r] || {}, u[r][a] = !0
        }

        function P() {
            try {
                var a = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (a && 3 < a.length) {
                    var i = s[S(a)];
                    if (i) return i;
                    y("Moment Timezone found " + a + " from the Intl api, but did not have that data loaded.")
                }
            } catch (a) {}
            var e, r, o, c = function() {
                    var a, i, e, r = (new Date).getFullYear() - 2,
                        o = new d(new Date(r, 0, 1)),
                        c = [o];
                    for (e = 1; e < 48; e++)(i = new d(new Date(r, e, 1))).offset !== o.offset && (a = g(o, i), c.push(a), c.push(new d(new Date(a.at + 6e4)))), o = i;
                    for (e = 0; e < 4; e++) c.push(new d(new Date(r + e, 0, 1))), c.push(new d(new Date(r + e, 6, 1)));
                    return c
                }(),
                A = c.length,
                n = function(a) {
                    var i, e, r, o = a.length,
                        c = {},
                        A = [];
                    for (i = 0; i < o; i++)
                        for (e in r = u[a[i].offset] || {}) r.hasOwnProperty(e) && (c[e] = !0);
                    for (i in c) c.hasOwnProperty(i) && A.push(s[i]);
                    return A
                }(c),
                t = [];
            for (r = 0; r < n.length; r++) {
                for (e = new h(_(n[r]), A), o = 0; o < A; o++) e.scoreOffsetAt(c[o]);
                t.push(e)
            }
            return t.sort(E), 0 < t.length ? t[0].zone.name : void 0
        }

        function S(a) {
            return (a || "").toLowerCase().replace(/\//g, "_")
        }

        function T(a) {
            var i, e, r, o;
            for ("string" == typeof a && (a = [a]), i = 0; i < a.length; i++) o = S(e = (r = a[i].split("|"))[0]), A[o] = a[i], s[o] = e, z(o, r[2].split(" "))
        }

        function _(a, i) {
            a = S(a);
            var e, r = A[a];
            return r instanceof M ? r : "string" == typeof r ? (r = new M(r), A[a] = r) : n[a] && i !== _ && (e = _(n[a], _)) ? ((r = A[a] = new M)._set(e), r.name = s[a], r) : null
        }

        function k(a) {
            var i, e, r, o;
            for ("string" == typeof a && (a = [a]), i = 0; i < a.length; i++) r = S((e = a[i].split("|"))[0]), o = S(e[1]), n[r] = o, s[r] = e[0], n[o] = r, s[o] = e[1]
        }

        function B(a) {
            T(a.zones), k(a.links),
                function(a) {
                    var i, e, r, o;
                    if (a && a.length)
                        for (i = 0; i < a.length; i++) e = (o = a[i].split("|"))[0].toUpperCase(), r = o[1].split(" "), t[e] = new b(e, r)
                }(a.countries), O.dataVersion = a.version
        }

        function C(a) {
            var i = "X" === a._f || "x" === a._f;
            return !(!a._a || void 0 !== a._tzm || i)
        }

        function y(a) {
            "undefined" != typeof console && "function" == typeof console.error && console.error(a)
        }

        function O(a) {
            var i = Array.prototype.slice.call(arguments, 0, -1),
                e = arguments[arguments.length - 1],
                r = _(e),
                o = c.utc.apply(null, i);
            return r && !c.isMoment(a) && C(o) && o.add(r.parse(o), "minutes"), o.tz(e), o
        }(e < 2 || 2 == e && r < 6) && y("Moment Timezone requires Moment.js >= 2.6.0. You are using Moment.js " + c.version + ". See momentjs.com"), M.prototype = {
            _set: function(a) {
                this.name = a.name, this.abbrs = a.abbrs, this.untils = a.untils, this.offsets = a.offsets, this.population = a.population
            },
            _index: function(a) {
                var i, e = +a,
                    r = this.untils;
                for (i = 0; i < r.length; i++)
                    if (e < r[i]) return i
            },
            countries: function() {
                var i = this.name;
                return Object.keys(t).filter(function(a) {
                    return -1 !== t[a].zones.indexOf(i)
                })
            },
            parse: function(a) {
                var i, e, r, o, c = +a,
                    A = this.offsets,
                    n = this.untils,
                    t = n.length - 1;
                for (o = 0; o < t; o++)
                    if (i = A[o], e = A[o + 1], r = A[o ? o - 1 : o], i < e && O.moveAmbiguousForward ? i = e : r < i && O.moveInvalidForward && (i = r), c < n[o] - 6e4 * i) return A[o];
                return A[t]
            },
            abbr: function(a) {
                return this.abbrs[this._index(a)]
            },
            offset: function(a) {
                return y("zone.offset has been deprecated in favor of zone.utcOffset"), this.offsets[this._index(a)]
            },
            utcOffset: function(a) {
                return this.offsets[this._index(a)]
            }
        }, h.prototype.scoreOffsetAt = function(a) {
            this.offsetScore += Math.abs(this.zone.utcOffset(a.at) - a.offset), this.zone.abbr(a.at).replace(/[^A-Z]/g, "") !== a.abbr && this.abbrScore++
        }, O.version = "0.5.34", O.dataVersion = "", O._zones = A, O._links = n, O._names = s, O._countries = t, O.add = T, O.link = k, O.load = B, O.zone = _, O.zoneExists = function a(i) {
            return a.didShowError || (a.didShowError = !0, y("moment.tz.zoneExists('" + i + "') has been deprecated in favor of !moment.tz.zone('" + i + "')")), !!_(i)
        }, O.guess = function(a) {
            return i && !a || (i = P()), i
        }, O.names = function() {
            var a, i = [];
            for (a in s) s.hasOwnProperty(a) && (A[a] || A[n[a]]) && s[a] && i.push(s[a]);
            return i.sort()
        }, O.Zone = M, O.unpack = p, O.unpackBase60 = o, O.needsOffset = C, O.moveInvalidForward = !0, O.moveAmbiguousForward = !1, O.countries = function() {
            return Object.keys(t)
        }, O.zonesForCountry = function(a, i) {
            if (!(a = function(a) {
                    return a = a.toUpperCase(), t[a] || null
                }(a))) return null;
            var e = a.zones.sort();
            return i ? e.map(function(a) {
                return {
                    name: a,
                    offset: _(a).utcOffset(new Date)
                }
            }) : e
        };
        var L, N = c.fn;

        function D(a) {
            return function() {
                return this._z ? this._z.abbr(this) : a.call(this)
            }
        }

        function v(a) {
            return function() {
                return this._z = null, a.apply(this, arguments)
            }
        }
        c.tz = O, c.defaultZone = null, c.updateOffset = function(a, i) {
            var e, r = c.defaultZone;
            if (void 0 === a._z && (r && C(a) && !a._isUTC && (a._d = c.utc(a._a)._d, a.utc().add(r.parse(a), "minutes")), a._z = r), a._z)
                if (e = a._z.utcOffset(a), Math.abs(e) < 16 && (e /= 60), void 0 !== a.utcOffset) {
                    var o = a._z;
                    a.utcOffset(-e, i), a._z = o
                } else a.zone(e, i)
        }, N.tz = function(a, i) {
            if (a) {
                if ("string" != typeof a) throw new Error("Time zone name must be a string, got " + a + " [" + typeof a + "]");
                return this._z = _(a), this._z ? c.updateOffset(this, i) : y("Moment Timezone has no data for " + a + ". See http://momentjs.com/timezone/docs/#/data-loading/."), this
            }
            if (this._z) return this._z.name
        }, N.zoneName = D(N.zoneName), N.zoneAbbr = D(N.zoneAbbr), N.utc = v(N.utc), N.local = v(N.local), N.utcOffset = (L = N.utcOffset, function() {
            return 0 < arguments.length && (this._z = null), L.apply(this, arguments)
        }), c.tz.setDefault = function(a) {
            return (e < 2 || 2 == e && r < 9) && y("Moment Timezone setDefault() requires Moment.js >= 2.9.0. You are using Moment.js " + c.version + "."), c.defaultZone = a ? _(a) : null, c
        };
        var G = c.momentProperties;
        return "[object Array]" === Object.prototype.toString.call(G) ? (G.push("_z"), G.push("_a")) : G && (G._z = null), B({
            version: "2021e",
            zones: ["Africa/Abidjan|GMT|0|0||48e5", "Africa/Nairobi|EAT|-30|0||47e5", "Africa/Algiers|CET|-10|0||26e5", "Africa/Lagos|WAT|-10|0||17e6", "Africa/Maputo|CAT|-20|0||26e5", "Africa/Cairo|EET|-20|0||15e6", "Africa/Casablanca|+00 +01|0 -10|0101010101010101010101010101|1QyO0 s00 e00 IM0 WM0 mo0 gM0 LA0 WM0 jA0 e00 28M0 e00 2600 gM0 2600 e00 2600 gM0 2600 gM0 2600 e00 2600 gM0 2600 e00|32e5", "Europe/Paris|CET CEST|-10 -20|01010101010101010101010|1QyN0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|11e6", "Africa/Johannesburg|SAST|-20|0||84e5", "Africa/Juba|EAT CAT|-30 -20|01|24nx0|", "Africa/Khartoum|EAT CAT|-30 -20|01|1Usl0|51e5", "Africa/Sao_Tome|GMT WAT|0 -10|010|1UQN0 2q00|", "Africa/Windhoek|CAT WAT|-20 -10|01010|1QBA0 11B0 1nX0 11B0|32e4", "America/Adak|HST HDT|a0 90|01010101010101010101010|1Qto0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|326", "America/Anchorage|AKST AKDT|90 80|01010101010101010101010|1Qtn0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|30e4", "America/Santo_Domingo|AST|40|0||29e5", "America/Fortaleza|-03|30|0||34e5", "America/Asuncion|-03 -04|30 40|01010101010101010101010|1QyP0 1fB0 19X0 1fB0 19X0 1ip0 17b0 1ip0 17b0 1ip0 19X0 1fB0 19X0 1fB0 19X0 1fB0 19X0 1ip0 17b0 1ip0 17b0 1ip0|28e5", "America/Panama|EST|50|0||15e5", "America/Mexico_City|CST CDT|60 50|01010101010101010101010|1QBI0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0|20e6", "America/Managua|CST|60|0||22e5", "America/La_Paz|-04|40|0||19e5", "America/Lima|-05|50|0||11e6", "America/Denver|MST MDT|70 60|01010101010101010101010|1Qtl0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|26e5", "America/Campo_Grande|-03 -04|30 40|01010101|1QkP0 1zd0 On0 1zd0 On0 1HB0 FX0|77e4", "America/Caracas|-0430 -04|4u 40|01|1QMT0|29e5", "America/Chicago|CST CDT|60 50|01010101010101010101010|1Qtk0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|92e5", "America/Chihuahua|MST MDT|70 60|01010101010101010101010|1QBJ0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1nX0 11B0 1nX0 11B0 1nX0 14p0 1lb0 14p0 1lb0 14p0 1lb0|81e4", "America/Phoenix|MST|70|0||42e5", "America/Whitehorse|PST PDT MST|80 70 70|01010101012|1Qtm0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1z90|23e3", "America/New_York|EST EDT|50 40|01010101010101010101010|1Qtj0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|21e6", "America/Los_Angeles|PST PDT|80 70|01010101010101010101010|1Qtm0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|15e6", "America/Halifax|AST ADT|40 30|01010101010101010101010|1Qti0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|39e4", "America/Godthab|-03 -02|30 20|01010101010101010101010|1QyN0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|17e3", "America/Grand_Turk|AST EDT EST|40 40 50|0121212121212121212|1Vkv0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|37e2", "America/Havana|CST CDT|50 40|01010101010101010101010|1Qth0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0|21e5", "America/Metlakatla|AKST AKDT PST|90 80 80|010101201010101010101010|1Qtn0 1zb0 Op0 1zb0 Op0 1zb0 uM0 jB0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|14e2", "America/Miquelon|-03 -02|30 20|01010101010101010101010|1Qth0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|61e2", "America/Noronha|-02|20|0||30e2", "America/Port-au-Prince|EST EDT|50 40|010101010101010101010|1SST0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|23e5", "Antarctica/Palmer|-03 -04|30 40|010|1QSr0 Ap0|40", "America/Santiago|-03 -04|30 40|01010101010101010101010|1QSr0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1zb0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 11B0 1nX0 11B0 1nX0 11B0|62e5", "America/Sao_Paulo|-02 -03|20 30|01010101|1QkO0 1zd0 On0 1zd0 On0 1HB0 FX0|20e6", "Atlantic/Azores|-01 +00|10 0|01010101010101010101010|1QyN0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|25e4", "America/St_Johns|NST NDT|3u 2u|01010101010101010101010|1Qthu 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Rd0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0 Op0 1zb0|11e4", "Antarctica/Casey|+08 +11|-80 -b0|01010101|1RWg0 3m10 1o30 14k0 1kr0 12l0 1o01|10", "Asia/Bangkok|+07|-70|0||15e6", "Asia/Vladivostok|+10|-a0|0||60e4", "Australia/Sydney|AEDT AEST|-b0 -a0|01010101010101010101010|1QBs0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0|40e5", "Asia/Tashkent|+05|-50|0||23e5", "Pacific/Auckland|NZDT NZST|-d0 -c0|01010101010101010101010|1QBq0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1io0 1a00 1fA0 1a00 1fA0 1a00|14e5", "Asia/Baghdad|+03|-30|0||66e5", "Antarctica/Troll|+00 +02|0 -20|01010101010101010101010|1QyN0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|40", "Asia/Dhaka|+06|-60|0||16e6", "Asia/Amman|EET EEST|-20 -30|01010101010101010101010|1QAK0 1o00 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 LA0 1C00 LA0 1C00 Oo0 1zc0 Oo0 1C00 LA0 1C00|25e5", "Asia/Kamchatka|+12|-c0|0||18e4", "Asia/Dubai|+04|-40|0||39e5", "Asia/Barnaul|+06 +07|-60 -70|01|1QyI0|", "Asia/Beirut|EET EEST|-20 -30|01010101010101010101010|1QyK0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0|22e5", "Asia/Kuala_Lumpur|+08|-80|0||71e5", "Asia/Kolkata|IST|-5u|0||15e6", "Asia/Chita|+08 +09|-80 -90|01|1QyG0|33e4", "Asia/Ulaanbaatar|+08 +09|-80 -90|010|1Qyi0 1cJ0|12e5", "Asia/Shanghai|CST|-80|0||23e6", "Asia/Colombo|+0530|-5u|0||22e5", "Asia/Damascus|EET EEST|-20 -30|01010101010101010101010|1QxW0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0 WN0 1qL0 11B0 1nX0 11B0 1nX0 11B0 1qL0 WN0 1qL0|26e5", "Asia/Yakutsk|+09|-90|0||28e4", "Asia/Famagusta|EET EEST +03|-20 -30 -30|0120101010101010101010|1QyN0 15U0 2Ks0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|", "Asia/Gaza|EET EEST|-20 -30|01010101010101010101010|1Qyn0 1qL0 WN0 1qL0 WN0 1qL0 11c0 1on0 11B0 1o00 11A0 1qo0 Xc0 1qo0 Xc0 1qo0 1200 1nA0 1200 1qo0 Xc0 1qo0|18e5", "Asia/Hong_Kong|HKT|-80|0||73e5", "Asia/Hovd|+07 +08|-70 -80|010|1Qyj0 1cJ0|81e3", "Europe/Istanbul|EET EEST +03|-20 -30 -30|012|1QyN0 15w0|13e6", "Asia/Jakarta|WIB|-70|0||31e6", "Asia/Jayapura|WIT|-90|0||26e4", "Asia/Jerusalem|IST IDT|-20 -30|01010101010101010101010|1Qy00 1rz0 W10 1rz0 W10 1rz0 10N0 1oL0 10N0 1oL0 10N0 1rz0 W10 1rz0 W10 1rz0 10N0 1oL0 10N0 1oL0 10N0 1oL0|81e4", "Asia/Kabul|+0430|-4u|0||46e5", "Asia/Karachi|PKT|-50|0||24e6", "Asia/Kathmandu|+0545|-5J|0||12e5", "Asia/Magadan|+10 +11|-a0 -b0|01|1QJQ0|95e3", "Asia/Makassar|WITA|-80|0||15e5", "Asia/Manila|PST|-80|0||24e6", "Europe/Athens|EET EEST|-20 -30|01010101010101010101010|1QyN0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|35e5", "Asia/Novosibirsk|+06 +07|-60 -70|01|1Rmk0|15e5", "Asia/Pyongyang|KST KST|-8u -90|01|1VGf0|29e5", "Asia/Qyzylorda|+06 +05|-60 -50|01|1Xei0|73e4", "Asia/Rangoon|+0630|-6u|0||48e5", "Asia/Sakhalin|+10 +11|-a0 -b0|01|1QyE0|58e4", "Asia/Seoul|KST|-90|0||23e6", "Pacific/Bougainville|+11|-b0|0||18e4", "Asia/Tehran|+0330 +0430|-3u -4u|01010101010101010101010|1Qwku 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0 1cp0 1dz0 1cp0 1dz0 1cN0 1dz0 1cp0 1dz0|14e6", "Asia/Tokyo|JST|-90|0||38e6", "Asia/Tomsk|+06 +07|-60 -70|01|1QXU0|10e5", "Europe/Lisbon|WET WEST|0 -10|01010101010101010101010|1QyN0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|27e5", "Atlantic/Cape_Verde|-01|10|0||50e4", "Australia/Adelaide|ACDT ACST|-au -9u|01010101010101010101010|1QBsu 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0|11e5", "Australia/Brisbane|AEST|-a0|0||20e5", "Australia/Darwin|ACST|-9u|0||12e4", "Australia/Eucla|+0845|-8J|0||368", "Australia/Lord_Howe|+11 +1030|-b0 -au|01010101010101010101010|1QBr0 1cMu 1cLu 1cMu 1cLu 1fAu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1cLu 1cMu 1fzu 1cMu 1cLu 1cMu 1cLu 1cMu|347", "Australia/Perth|AWST|-80|0||18e5", "Pacific/Easter|-05 -06|50 60|01010101010101010101010|1QSr0 Ap0 1Nb0 Ap0 1Nb0 Ap0 1zb0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1nX0 11B0 1qL0 11B0 1nX0 11B0 1nX0 11B0|30e2", "Europe/Dublin|GMT IST|0 -10|01010101010101010101010|1QyN0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|12e5", "Etc/GMT-1|+01|-10|0||", "Pacific/Fakaofo|+13|-d0|0||483", "Pacific/Kiritimati|+14|-e0|0||51e2", "Etc/GMT-2|+02|-20|0||", "Pacific/Tahiti|-10|a0|0||18e4", "Pacific/Niue|-11|b0|0||12e2", "Etc/GMT+12|-12|c0|0||", "Pacific/Galapagos|-06|60|0||25e3", "Etc/GMT+7|-07|70|0||", "Pacific/Pitcairn|-08|80|0||56", "Pacific/Gambier|-09|90|0||125", "Etc/UTC|UTC|0|0||", "Europe/Ulyanovsk|+03 +04|-30 -40|01|1QyL0|13e5", "Europe/London|GMT BST|0 -10|01010101010101010101010|1QyN0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|10e6", "Europe/Chisinau|EET EEST|-20 -30|01010101010101010101010|1QyM0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|67e4", "Europe/Moscow|MSK|-30|0||16e6", "Europe/Saratov|+03 +04|-30 -40|01|1Sfz0|", "Europe/Volgograd|+03 +04|-30 -40|010|1WQL0 5gn0|10e5", "Pacific/Honolulu|HST|a0|0||37e4", "MET|MET MEST|-10 -20|01010101010101010101010|1QyN0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 WM0 1qM0 11A0 1o00 11A0 1o00 11A0 1o00|", "Pacific/Chatham|+1345 +1245|-dJ -cJ|01010101010101010101010|1QBq0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1fA0 1a00 1io0 1a00 1fA0 1a00 1fA0 1a00|600", "Pacific/Apia|+14 +13|-e0 -d0|010101010101|1QBq0 1a00 1fA0 1a00 1fA0 1cM0 1fA0 1a00 1fA0 1a00 1fA0|37e3", "Pacific/Fiji|+13 +12|-d0 -c0|010101010101010101010|1Q6C0 1VA0 s00 1VA0 s00 1VA0 s00 20o0 pc0 2hc0 bc0 4q00 pc0 20o0 pc0 20o0 pc0 20o0 s00 1VA0|88e4", "Pacific/Guam|ChST|-a0|0||17e4", "Pacific/Marquesas|-0930|9u|0||86e2", "Pacific/Pago_Pago|SST|b0|0||37e2", "Pacific/Norfolk|+11 +12|-b0 -c0|0101010101010101|219P0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0|25e4", "Pacific/Tongatapu|+13 +14|-d0 -e0|010|1S4d0 s00|75e3"],
            links: ["Africa/Abidjan|Africa/Accra", "Africa/Abidjan|Africa/Bamako", "Africa/Abidjan|Africa/Banjul", "Africa/Abidjan|Africa/Bissau", "Africa/Abidjan|Africa/Conakry", "Africa/Abidjan|Africa/Dakar", "Africa/Abidjan|Africa/Freetown", "Africa/Abidjan|Africa/Lome", "Africa/Abidjan|Africa/Monrovia", "Africa/Abidjan|Africa/Nouakchott", "Africa/Abidjan|Africa/Ouagadougou", "Africa/Abidjan|Africa/Timbuktu", "Africa/Abidjan|America/Danmarkshavn", "Africa/Abidjan|Atlantic/Reykjavik", "Africa/Abidjan|Atlantic/St_Helena", "Africa/Abidjan|Etc/GMT", "Africa/Abidjan|Etc/GMT+0", "Africa/Abidjan|Etc/GMT-0", "Africa/Abidjan|Etc/GMT0", "Africa/Abidjan|Etc/Greenwich", "Africa/Abidjan|GMT", "Africa/Abidjan|GMT+0", "Africa/Abidjan|GMT-0", "Africa/Abidjan|GMT0", "Africa/Abidjan|Greenwich", "Africa/Abidjan|Iceland", "Africa/Algiers|Africa/Tunis", "Africa/Cairo|Africa/Tripoli", "Africa/Cairo|Egypt", "Africa/Cairo|Europe/Kaliningrad", "Africa/Cairo|Libya", "Africa/Casablanca|Africa/El_Aaiun", "Africa/Johannesburg|Africa/Maseru", "Africa/Johannesburg|Africa/Mbabane", "Africa/Lagos|Africa/Bangui", "Africa/Lagos|Africa/Brazzaville", "Africa/Lagos|Africa/Douala", "Africa/Lagos|Africa/Kinshasa", "Africa/Lagos|Africa/Libreville", "Africa/Lagos|Africa/Luanda", "Africa/Lagos|Africa/Malabo", "Africa/Lagos|Africa/Ndjamena", "Africa/Lagos|Africa/Niamey", "Africa/Lagos|Africa/Porto-Novo", "Africa/Maputo|Africa/Blantyre", "Africa/Maputo|Africa/Bujumbura", "Africa/Maputo|Africa/Gaborone", "Africa/Maputo|Africa/Harare", "Africa/Maputo|Africa/Kigali", "Africa/Maputo|Africa/Lubumbashi", "Africa/Maputo|Africa/Lusaka", "Africa/Nairobi|Africa/Addis_Ababa", "Africa/Nairobi|Africa/Asmara", "Africa/Nairobi|Africa/Asmera", "Africa/Nairobi|Africa/Dar_es_Salaam", "Africa/Nairobi|Africa/Djibouti", "Africa/Nairobi|Africa/Kampala", "Africa/Nairobi|Africa/Mogadishu", "Africa/Nairobi|Indian/Antananarivo", "Africa/Nairobi|Indian/Comoro", "Africa/Nairobi|Indian/Mayotte", "America/Adak|America/Atka", "America/Adak|US/Aleutian", "America/Anchorage|America/Juneau", "America/Anchorage|America/Nome", "America/Anchorage|America/Sitka", "America/Anchorage|America/Yakutat", "America/Anchorage|US/Alaska", "America/Campo_Grande|America/Cuiaba", "America/Chicago|America/Indiana/Knox", "America/Chicago|America/Indiana/Tell_City", "America/Chicago|America/Knox_IN", "America/Chicago|America/Matamoros", "America/Chicago|America/Menominee", "America/Chicago|America/North_Dakota/Beulah", "America/Chicago|America/North_Dakota/Center", "America/Chicago|America/North_Dakota/New_Salem", "America/Chicago|America/Rainy_River", "America/Chicago|America/Rankin_Inlet", "America/Chicago|America/Resolute", "America/Chicago|America/Winnipeg", "America/Chicago|CST6CDT", "America/Chicago|Canada/Central", "America/Chicago|US/Central", "America/Chicago|US/Indiana-Starke", "America/Chihuahua|America/Mazatlan", "America/Chihuahua|Mexico/BajaSur", "America/Denver|America/Boise", "America/Denver|America/Cambridge_Bay", "America/Denver|America/Edmonton", "America/Denver|America/Inuvik", "America/Denver|America/Ojinaga", "America/Denver|America/Shiprock", "America/Denver|America/Yellowknife", "America/Denver|Canada/Mountain", "America/Denver|MST7MDT", "America/Denver|Navajo", "America/Denver|US/Mountain", "America/Fortaleza|America/Araguaina", "America/Fortaleza|America/Argentina/Buenos_Aires", "America/Fortaleza|America/Argentina/Catamarca", "America/Fortaleza|America/Argentina/ComodRivadavia", "America/Fortaleza|America/Argentina/Cordoba", "America/Fortaleza|America/Argentina/Jujuy", "America/Fortaleza|America/Argentina/La_Rioja", "America/Fortaleza|America/Argentina/Mendoza", "America/Fortaleza|America/Argentina/Rio_Gallegos", "America/Fortaleza|America/Argentina/Salta", "America/Fortaleza|America/Argentina/San_Juan", "America/Fortaleza|America/Argentina/San_Luis", "America/Fortaleza|America/Argentina/Tucuman", "America/Fortaleza|America/Argentina/Ushuaia", "America/Fortaleza|America/Bahia", "America/Fortaleza|America/Belem", "America/Fortaleza|America/Buenos_Aires", "America/Fortaleza|America/Catamarca", "America/Fortaleza|America/Cayenne", "America/Fortaleza|America/Cordoba", "America/Fortaleza|America/Jujuy", "America/Fortaleza|America/Maceio", "America/Fortaleza|America/Mendoza", "America/Fortaleza|America/Montevideo", "America/Fortaleza|America/Paramaribo", "America/Fortaleza|America/Recife", "America/Fortaleza|America/Rosario", "America/Fortaleza|America/Santarem", "America/Fortaleza|Antarctica/Rothera", "America/Fortaleza|Atlantic/Stanley", "America/Fortaleza|Etc/GMT+3", "America/Godthab|America/Nuuk", "America/Halifax|America/Glace_Bay", "America/Halifax|America/Goose_Bay", "America/Halifax|America/Moncton", "America/Halifax|America/Thule", "America/Halifax|Atlantic/Bermuda", "America/Halifax|Canada/Atlantic", "America/Havana|Cuba", "America/La_Paz|America/Boa_Vista", "America/La_Paz|America/Guyana", "America/La_Paz|America/Manaus", "America/La_Paz|America/Porto_Velho", "America/La_Paz|Brazil/West", "America/La_Paz|Etc/GMT+4", "America/Lima|America/Bogota", "America/Lima|America/Eirunepe", "America/Lima|America/Guayaquil", "America/Lima|America/Porto_Acre", "America/Lima|America/Rio_Branco", "America/Lima|Brazil/Acre", "America/Lima|Etc/GMT+5", "America/Los_Angeles|America/Ensenada", "America/Los_Angeles|America/Santa_Isabel", "America/Los_Angeles|America/Tijuana", "America/Los_Angeles|America/Vancouver", "America/Los_Angeles|Canada/Pacific", "America/Los_Angeles|Mexico/BajaNorte", "America/Los_Angeles|PST8PDT", "America/Los_Angeles|US/Pacific", "America/Managua|America/Belize", "America/Managua|America/Costa_Rica", "America/Managua|America/El_Salvador", "America/Managua|America/Guatemala", "America/Managua|America/Regina", "America/Managua|America/Swift_Current", "America/Managua|America/Tegucigalpa", "America/Managua|Canada/Saskatchewan", "America/Mexico_City|America/Bahia_Banderas", "America/Mexico_City|America/Merida", "America/Mexico_City|America/Monterrey", "America/Mexico_City|Mexico/General", "America/New_York|America/Detroit", "America/New_York|America/Fort_Wayne", "America/New_York|America/Indiana/Indianapolis", "America/New_York|America/Indiana/Marengo", "America/New_York|America/Indiana/Petersburg", "America/New_York|America/Indiana/Vevay", "America/New_York|America/Indiana/Vincennes", "America/New_York|America/Indiana/Winamac", "America/New_York|America/Indianapolis", "America/New_York|America/Iqaluit", "America/New_York|America/Kentucky/Louisville", "America/New_York|America/Kentucky/Monticello", "America/New_York|America/Louisville", "America/New_York|America/Montreal", "America/New_York|America/Nassau", "America/New_York|America/Nipigon", "America/New_York|America/Pangnirtung", "America/New_York|America/Thunder_Bay", "America/New_York|America/Toronto", "America/New_York|Canada/Eastern", "America/New_York|EST5EDT", "America/New_York|US/East-Indiana", "America/New_York|US/Eastern", "America/New_York|US/Michigan", "America/Noronha|Atlantic/South_Georgia", "America/Noronha|Brazil/DeNoronha", "America/Noronha|Etc/GMT+2", "America/Panama|America/Atikokan", "America/Panama|America/Cancun", "America/Panama|America/Cayman", "America/Panama|America/Coral_Harbour", "America/Panama|America/Jamaica", "America/Panama|EST", "America/Panama|Jamaica", "America/Phoenix|America/Creston", "America/Phoenix|America/Dawson_Creek", "America/Phoenix|America/Fort_Nelson", "America/Phoenix|America/Hermosillo", "America/Phoenix|MST", "America/Phoenix|US/Arizona", "America/Santiago|Chile/Continental", "America/Santo_Domingo|America/Anguilla", "America/Santo_Domingo|America/Antigua", "America/Santo_Domingo|America/Aruba", "America/Santo_Domingo|America/Barbados", "America/Santo_Domingo|America/Blanc-Sablon", "America/Santo_Domingo|America/Curacao", "America/Santo_Domingo|America/Dominica", "America/Santo_Domingo|America/Grenada", "America/Santo_Domingo|America/Guadeloupe", "America/Santo_Domingo|America/Kralendijk", "America/Santo_Domingo|America/Lower_Princes", "America/Santo_Domingo|America/Marigot", "America/Santo_Domingo|America/Martinique", "America/Santo_Domingo|America/Montserrat", "America/Santo_Domingo|America/Port_of_Spain", "America/Santo_Domingo|America/Puerto_Rico", "America/Santo_Domingo|America/St_Barthelemy", "America/Santo_Domingo|America/St_Kitts", "America/Santo_Domingo|America/St_Lucia", "America/Santo_Domingo|America/St_Thomas", "America/Santo_Domingo|America/St_Vincent", "America/Santo_Domingo|America/Tortola", "America/Santo_Domingo|America/Virgin", "America/Sao_Paulo|Brazil/East", "America/St_Johns|Canada/Newfoundland", "America/Whitehorse|America/Dawson", "America/Whitehorse|Canada/Yukon", "Antarctica/Palmer|America/Punta_Arenas", "Asia/Baghdad|Antarctica/Syowa", "Asia/Baghdad|Asia/Aden", "Asia/Baghdad|Asia/Bahrain", "Asia/Baghdad|Asia/Kuwait", "Asia/Baghdad|Asia/Qatar", "Asia/Baghdad|Asia/Riyadh", "Asia/Baghdad|Etc/GMT-3", "Asia/Baghdad|Europe/Kirov", "Asia/Baghdad|Europe/Minsk", "Asia/Bangkok|Antarctica/Davis", "Asia/Bangkok|Asia/Ho_Chi_Minh", "Asia/Bangkok|Asia/Krasnoyarsk", "Asia/Bangkok|Asia/Novokuznetsk", "Asia/Bangkok|Asia/Phnom_Penh", "Asia/Bangkok|Asia/Saigon", "Asia/Bangkok|Asia/Vientiane", "Asia/Bangkok|Etc/GMT-7", "Asia/Bangkok|Indian/Christmas", "Asia/Dhaka|Antarctica/Vostok", "Asia/Dhaka|Asia/Almaty", "Asia/Dhaka|Asia/Bishkek", "Asia/Dhaka|Asia/Dacca", "Asia/Dhaka|Asia/Kashgar", "Asia/Dhaka|Asia/Omsk", "Asia/Dhaka|Asia/Qostanay", "Asia/Dhaka|Asia/Thimbu", "Asia/Dhaka|Asia/Thimphu", "Asia/Dhaka|Asia/Urumqi", "Asia/Dhaka|Etc/GMT-6", "Asia/Dhaka|Indian/Chagos", "Asia/Dubai|Asia/Baku", "Asia/Dubai|Asia/Muscat", "Asia/Dubai|Asia/Tbilisi", "Asia/Dubai|Asia/Yerevan", "Asia/Dubai|Etc/GMT-4", "Asia/Dubai|Europe/Samara", "Asia/Dubai|Indian/Mahe", "Asia/Dubai|Indian/Mauritius", "Asia/Dubai|Indian/Reunion", "Asia/Gaza|Asia/Hebron", "Asia/Hong_Kong|Hongkong", "Asia/Jakarta|Asia/Pontianak", "Asia/Jerusalem|Asia/Tel_Aviv", "Asia/Jerusalem|Israel", "Asia/Kamchatka|Asia/Anadyr", "Asia/Kamchatka|Etc/GMT-12", "Asia/Kamchatka|Kwajalein", "Asia/Kamchatka|Pacific/Funafuti", "Asia/Kamchatka|Pacific/Kwajalein", "Asia/Kamchatka|Pacific/Majuro", "Asia/Kamchatka|Pacific/Nauru", "Asia/Kamchatka|Pacific/Tarawa", "Asia/Kamchatka|Pacific/Wake", "Asia/Kamchatka|Pacific/Wallis", "Asia/Kathmandu|Asia/Katmandu", "Asia/Kolkata|Asia/Calcutta", "Asia/Kuala_Lumpur|Asia/Brunei", "Asia/Kuala_Lumpur|Asia/Irkutsk", "Asia/Kuala_Lumpur|Asia/Kuching", "Asia/Kuala_Lumpur|Asia/Singapore", "Asia/Kuala_Lumpur|Etc/GMT-8", "Asia/Kuala_Lumpur|Singapore", "Asia/Makassar|Asia/Ujung_Pandang", "Asia/Rangoon|Asia/Yangon", "Asia/Rangoon|Indian/Cocos", "Asia/Seoul|ROK", "Asia/Shanghai|Asia/Chongqing", "Asia/Shanghai|Asia/Chungking", "Asia/Shanghai|Asia/Harbin", "Asia/Shanghai|Asia/Macao", "Asia/Shanghai|Asia/Macau", "Asia/Shanghai|Asia/Taipei", "Asia/Shanghai|PRC", "Asia/Shanghai|ROC", "Asia/Tashkent|Antarctica/Mawson", "Asia/Tashkent|Asia/Aqtau", "Asia/Tashkent|Asia/Aqtobe", "Asia/Tashkent|Asia/Ashgabat", "Asia/Tashkent|Asia/Ashkhabad", "Asia/Tashkent|Asia/Atyrau", "Asia/Tashkent|Asia/Dushanbe", "Asia/Tashkent|Asia/Oral", "Asia/Tashkent|Asia/Samarkand", "Asia/Tashkent|Asia/Yekaterinburg", "Asia/Tashkent|Etc/GMT-5", "Asia/Tashkent|Indian/Kerguelen", "Asia/Tashkent|Indian/Maldives", "Asia/Tehran|Iran", "Asia/Tokyo|Japan", "Asia/Ulaanbaatar|Asia/Choibalsan", "Asia/Ulaanbaatar|Asia/Ulan_Bator", "Asia/Vladivostok|Antarctica/DumontDUrville", "Asia/Vladivostok|Asia/Ust-Nera", "Asia/Vladivostok|Etc/GMT-10", "Asia/Vladivostok|Pacific/Chuuk", "Asia/Vladivostok|Pacific/Port_Moresby", "Asia/Vladivostok|Pacific/Truk", "Asia/Vladivostok|Pacific/Yap", "Asia/Yakutsk|Asia/Dili", "Asia/Yakutsk|Asia/Khandyga", "Asia/Yakutsk|Etc/GMT-9", "Asia/Yakutsk|Pacific/Palau", "Atlantic/Azores|America/Scoresbysund", "Atlantic/Cape_Verde|Etc/GMT+1", "Australia/Adelaide|Australia/Broken_Hill", "Australia/Adelaide|Australia/South", "Australia/Adelaide|Australia/Yancowinna", "Australia/Brisbane|Australia/Lindeman", "Australia/Brisbane|Australia/Queensland", "Australia/Darwin|Australia/North", "Australia/Lord_Howe|Australia/LHI", "Australia/Perth|Australia/West", "Australia/Sydney|Antarctica/Macquarie", "Australia/Sydney|Australia/ACT", "Australia/Sydney|Australia/Canberra", "Australia/Sydney|Australia/Currie", "Australia/Sydney|Australia/Hobart", "Australia/Sydney|Australia/Melbourne", "Australia/Sydney|Australia/NSW", "Australia/Sydney|Australia/Tasmania", "Australia/Sydney|Australia/Victoria", "Etc/UTC|Etc/UCT", "Etc/UTC|Etc/Universal", "Etc/UTC|Etc/Zulu", "Etc/UTC|UCT", "Etc/UTC|UTC", "Etc/UTC|Universal", "Etc/UTC|Zulu", "Europe/Athens|Asia/Nicosia", "Europe/Athens|EET", "Europe/Athens|Europe/Bucharest", "Europe/Athens|Europe/Helsinki", "Europe/Athens|Europe/Kiev", "Europe/Athens|Europe/Mariehamn", "Europe/Athens|Europe/Nicosia", "Europe/Athens|Europe/Riga", "Europe/Athens|Europe/Sofia", "Europe/Athens|Europe/Tallinn", "Europe/Athens|Europe/Uzhgorod", "Europe/Athens|Europe/Vilnius", "Europe/Athens|Europe/Zaporozhye", "Europe/Chisinau|Europe/Tiraspol", "Europe/Dublin|Eire", "Europe/Istanbul|Asia/Istanbul", "Europe/Istanbul|Turkey", "Europe/Lisbon|Atlantic/Canary", "Europe/Lisbon|Atlantic/Faeroe", "Europe/Lisbon|Atlantic/Faroe", "Europe/Lisbon|Atlantic/Madeira", "Europe/Lisbon|Portugal", "Europe/Lisbon|WET", "Europe/London|Europe/Belfast", "Europe/London|Europe/Guernsey", "Europe/London|Europe/Isle_of_Man", "Europe/London|Europe/Jersey", "Europe/London|GB", "Europe/London|GB-Eire", "Europe/Moscow|Europe/Simferopol", "Europe/Moscow|W-SU", "Europe/Paris|Africa/Ceuta", "Europe/Paris|Arctic/Longyearbyen", "Europe/Paris|Atlantic/Jan_Mayen", "Europe/Paris|CET", "Europe/Paris|Europe/Amsterdam", "Europe/Paris|Europe/Andorra", "Europe/Paris|Europe/Belgrade", "Europe/Paris|Europe/Berlin", "Europe/Paris|Europe/Bratislava", "Europe/Paris|Europe/Brussels", "Europe/Paris|Europe/Budapest", "Europe/Paris|Europe/Busingen", "Europe/Paris|Europe/Copenhagen", "Europe/Paris|Europe/Gibraltar", "Europe/Paris|Europe/Ljubljana", "Europe/Paris|Europe/Luxembourg", "Europe/Paris|Europe/Madrid", "Europe/Paris|Europe/Malta", "Europe/Paris|Europe/Monaco", "Europe/Paris|Europe/Oslo", "Europe/Paris|Europe/Podgorica", "Europe/Paris|Europe/Prague", "Europe/Paris|Europe/Rome", "Europe/Paris|Europe/San_Marino", "Europe/Paris|Europe/Sarajevo", "Europe/Paris|Europe/Skopje", "Europe/Paris|Europe/Stockholm", "Europe/Paris|Europe/Tirane", "Europe/Paris|Europe/Vaduz", "Europe/Paris|Europe/Vatican", "Europe/Paris|Europe/Vienna", "Europe/Paris|Europe/Warsaw", "Europe/Paris|Europe/Zagreb", "Europe/Paris|Europe/Zurich", "Europe/Paris|Poland", "Europe/Ulyanovsk|Europe/Astrakhan", "Pacific/Auckland|Antarctica/McMurdo", "Pacific/Auckland|Antarctica/South_Pole", "Pacific/Auckland|NZ", "Pacific/Bougainville|Asia/Srednekolymsk", "Pacific/Bougainville|Etc/GMT-11", "Pacific/Bougainville|Pacific/Efate", "Pacific/Bougainville|Pacific/Guadalcanal", "Pacific/Bougainville|Pacific/Kosrae", "Pacific/Bougainville|Pacific/Noumea", "Pacific/Bougainville|Pacific/Pohnpei", "Pacific/Bougainville|Pacific/Ponape", "Pacific/Chatham|NZ-CHAT", "Pacific/Easter|Chile/EasterIsland", "Pacific/Fakaofo|Etc/GMT-13", "Pacific/Fakaofo|Pacific/Enderbury", "Pacific/Fakaofo|Pacific/Kanton", "Pacific/Galapagos|Etc/GMT+6", "Pacific/Gambier|Etc/GMT+9", "Pacific/Guam|Pacific/Saipan", "Pacific/Honolulu|HST", "Pacific/Honolulu|Pacific/Johnston", "Pacific/Honolulu|US/Hawaii", "Pacific/Kiritimati|Etc/GMT-14", "Pacific/Niue|Etc/GMT+11", "Pacific/Pago_Pago|Pacific/Midway", "Pacific/Pago_Pago|Pacific/Samoa", "Pacific/Pago_Pago|US/Samoa", "Pacific/Pitcairn|Etc/GMT+8", "Pacific/Tahiti|Etc/GMT+10", "Pacific/Tahiti|Pacific/Rarotonga"],
            countries: ["AD|Europe/Andorra", "AE|Asia/Dubai", "AF|Asia/Kabul", "AG|America/Port_of_Spain America/Antigua", "AI|America/Port_of_Spain America/Anguilla", "AL|Europe/Tirane", "AM|Asia/Yerevan", "AO|Africa/Lagos Africa/Luanda", "AQ|Antarctica/Casey Antarctica/Davis Antarctica/DumontDUrville Antarctica/Mawson Antarctica/Palmer Antarctica/Rothera Antarctica/Syowa Antarctica/Troll Antarctica/Vostok Pacific/Auckland Antarctica/McMurdo", "AR|America/Argentina/Buenos_Aires America/Argentina/Cordoba America/Argentina/Salta America/Argentina/Jujuy America/Argentina/Tucuman America/Argentina/Catamarca America/Argentina/La_Rioja America/Argentina/San_Juan America/Argentina/Mendoza America/Argentina/San_Luis America/Argentina/Rio_Gallegos America/Argentina/Ushuaia", "AS|Pacific/Pago_Pago", "AT|Europe/Vienna", "AU|Australia/Lord_Howe Antarctica/Macquarie Australia/Hobart Australia/Melbourne Australia/Sydney Australia/Broken_Hill Australia/Brisbane Australia/Lindeman Australia/Adelaide Australia/Darwin Australia/Perth Australia/Eucla", "AW|America/Curacao America/Aruba", "AX|Europe/Helsinki Europe/Mariehamn", "AZ|Asia/Baku", "BA|Europe/Belgrade Europe/Sarajevo", "BB|America/Barbados", "BD|Asia/Dhaka", "BE|Europe/Brussels", "BF|Africa/Abidjan Africa/Ouagadougou", "BG|Europe/Sofia", "BH|Asia/Qatar Asia/Bahrain", "BI|Africa/Maputo Africa/Bujumbura", "BJ|Africa/Lagos Africa/Porto-Novo", "BL|America/Port_of_Spain America/St_Barthelemy", "BM|Atlantic/Bermuda", "BN|Asia/Brunei", "BO|America/La_Paz", "BQ|America/Curacao America/Kralendijk", "BR|America/Noronha America/Belem America/Fortaleza America/Recife America/Araguaina America/Maceio America/Bahia America/Sao_Paulo America/Campo_Grande America/Cuiaba America/Santarem America/Porto_Velho America/Boa_Vista America/Manaus America/Eirunepe America/Rio_Branco", "BS|America/Nassau", "BT|Asia/Thimphu", "BW|Africa/Maputo Africa/Gaborone", "BY|Europe/Minsk", "BZ|America/Belize", "CA|America/St_Johns America/Halifax America/Glace_Bay America/Moncton America/Goose_Bay America/Blanc-Sablon America/Toronto America/Nipigon America/Thunder_Bay America/Iqaluit America/Pangnirtung America/Atikokan America/Winnipeg America/Rainy_River America/Resolute America/Rankin_Inlet America/Regina America/Swift_Current America/Edmonton America/Cambridge_Bay America/Yellowknife America/Inuvik America/Creston America/Dawson_Creek America/Fort_Nelson America/Whitehorse America/Dawson America/Vancouver", "CC|Indian/Cocos", "CD|Africa/Maputo Africa/Lagos Africa/Kinshasa Africa/Lubumbashi", "CF|Africa/Lagos Africa/Bangui", "CG|Africa/Lagos Africa/Brazzaville", "CH|Europe/Zurich", "CI|Africa/Abidjan", "CK|Pacific/Rarotonga", "CL|America/Santiago America/Punta_Arenas Pacific/Easter", "CM|Africa/Lagos Africa/Douala", "CN|Asia/Shanghai Asia/Urumqi", "CO|America/Bogota", "CR|America/Costa_Rica", "CU|America/Havana", "CV|Atlantic/Cape_Verde", "CW|America/Curacao", "CX|Indian/Christmas", "CY|Asia/Nicosia Asia/Famagusta", "CZ|Europe/Prague", "DE|Europe/Zurich Europe/Berlin Europe/Busingen", "DJ|Africa/Nairobi Africa/Djibouti", "DK|Europe/Copenhagen", "DM|America/Port_of_Spain America/Dominica", "DO|America/Santo_Domingo", "DZ|Africa/Algiers", "EC|America/Guayaquil Pacific/Galapagos", "EE|Europe/Tallinn", "EG|Africa/Cairo", "EH|Africa/El_Aaiun", "ER|Africa/Nairobi Africa/Asmara", "ES|Europe/Madrid Africa/Ceuta Atlantic/Canary", "ET|Africa/Nairobi Africa/Addis_Ababa", "FI|Europe/Helsinki", "FJ|Pacific/Fiji", "FK|Atlantic/Stanley", "FM|Pacific/Chuuk Pacific/Pohnpei Pacific/Kosrae", "FO|Atlantic/Faroe", "FR|Europe/Paris", "GA|Africa/Lagos Africa/Libreville", "GB|Europe/London", "GD|America/Port_of_Spain America/Grenada", "GE|Asia/Tbilisi", "GF|America/Cayenne", "GG|Europe/London Europe/Guernsey", "GH|Africa/Accra", "GI|Europe/Gibraltar", "GL|America/Nuuk America/Danmarkshavn America/Scoresbysund America/Thule", "GM|Africa/Abidjan Africa/Banjul", "GN|Africa/Abidjan Africa/Conakry", "GP|America/Port_of_Spain America/Guadeloupe", "GQ|Africa/Lagos Africa/Malabo", "GR|Europe/Athens", "GS|Atlantic/South_Georgia", "GT|America/Guatemala", "GU|Pacific/Guam", "GW|Africa/Bissau", "GY|America/Guyana", "HK|Asia/Hong_Kong", "HN|America/Tegucigalpa", "HR|Europe/Belgrade Europe/Zagreb", "HT|America/Port-au-Prince", "HU|Europe/Budapest", "ID|Asia/Jakarta Asia/Pontianak Asia/Makassar Asia/Jayapura", "IE|Europe/Dublin", "IL|Asia/Jerusalem", "IM|Europe/London Europe/Isle_of_Man", "IN|Asia/Kolkata", "IO|Indian/Chagos", "IQ|Asia/Baghdad", "IR|Asia/Tehran", "IS|Atlantic/Reykjavik", "IT|Europe/Rome", "JE|Europe/London Europe/Jersey", "JM|America/Jamaica", "JO|Asia/Amman", "JP|Asia/Tokyo", "KE|Africa/Nairobi", "KG|Asia/Bishkek", "KH|Asia/Bangkok Asia/Phnom_Penh", "KI|Pacific/Tarawa Pacific/Enderbury Pacific/Kiritimati", "KM|Africa/Nairobi Indian/Comoro", "KN|America/Port_of_Spain America/St_Kitts", "KP|Asia/Pyongyang", "KR|Asia/Seoul", "KW|Asia/Riyadh Asia/Kuwait", "KY|America/Panama America/Cayman", "KZ|Asia/Almaty Asia/Qyzylorda Asia/Qostanay Asia/Aqtobe Asia/Aqtau Asia/Atyrau Asia/Oral", "LA|Asia/Bangkok Asia/Vientiane", "LB|Asia/Beirut", "LC|America/Port_of_Spain America/St_Lucia", "LI|Europe/Zurich Europe/Vaduz", "LK|Asia/Colombo", "LR|Africa/Monrovia", "LS|Africa/Johannesburg Africa/Maseru", "LT|Europe/Vilnius", "LU|Europe/Luxembourg", "LV|Europe/Riga", "LY|Africa/Tripoli", "MA|Africa/Casablanca", "MC|Europe/Monaco", "MD|Europe/Chisinau", "ME|Europe/Belgrade Europe/Podgorica", "MF|America/Port_of_Spain America/Marigot", "MG|Africa/Nairobi Indian/Antananarivo", "MH|Pacific/Majuro Pacific/Kwajalein", "MK|Europe/Belgrade Europe/Skopje", "ML|Africa/Abidjan Africa/Bamako", "MM|Asia/Yangon", "MN|Asia/Ulaanbaatar Asia/Hovd Asia/Choibalsan", "MO|Asia/Macau", "MP|Pacific/Guam Pacific/Saipan", "MQ|America/Martinique", "MR|Africa/Abidjan Africa/Nouakchott", "MS|America/Port_of_Spain America/Montserrat", "MT|Europe/Malta", "MU|Indian/Mauritius", "MV|Indian/Maldives", "MW|Africa/Maputo Africa/Blantyre", "MX|America/Mexico_City America/Cancun America/Merida America/Monterrey America/Matamoros America/Mazatlan America/Chihuahua America/Ojinaga America/Hermosillo America/Tijuana America/Bahia_Banderas", "MY|Asia/Kuala_Lumpur Asia/Kuching", "MZ|Africa/Maputo", "NA|Africa/Windhoek", "NC|Pacific/Noumea", "NE|Africa/Lagos Africa/Niamey", "NF|Pacific/Norfolk", "NG|Africa/Lagos", "NI|America/Managua", "NL|Europe/Amsterdam", "NO|Europe/Oslo", "NP|Asia/Kathmandu", "NR|Pacific/Nauru", "NU|Pacific/Niue", "NZ|Pacific/Auckland Pacific/Chatham", "OM|Asia/Dubai Asia/Muscat", "PA|America/Panama", "PE|America/Lima", "PF|Pacific/Tahiti Pacific/Marquesas Pacific/Gambier", "PG|Pacific/Port_Moresby Pacific/Bougainville", "PH|Asia/Manila", "PK|Asia/Karachi", "PL|Europe/Warsaw", "PM|America/Miquelon", "PN|Pacific/Pitcairn", "PR|America/Puerto_Rico", "PS|Asia/Gaza Asia/Hebron", "PT|Europe/Lisbon Atlantic/Madeira Atlantic/Azores", "PW|Pacific/Palau", "PY|America/Asuncion", "QA|Asia/Qatar", "RE|Indian/Reunion", "RO|Europe/Bucharest", "RS|Europe/Belgrade", "RU|Europe/Kaliningrad Europe/Moscow Europe/Simferopol Europe/Kirov Europe/Volgograd Europe/Astrakhan Europe/Saratov Europe/Ulyanovsk Europe/Samara Asia/Yekaterinburg Asia/Omsk Asia/Novosibirsk Asia/Barnaul Asia/Tomsk Asia/Novokuznetsk Asia/Krasnoyarsk Asia/Irkutsk Asia/Chita Asia/Yakutsk Asia/Khandyga Asia/Vladivostok Asia/Ust-Nera Asia/Magadan Asia/Sakhalin Asia/Srednekolymsk Asia/Kamchatka Asia/Anadyr", "RW|Africa/Maputo Africa/Kigali", "SA|Asia/Riyadh", "SB|Pacific/Guadalcanal", "SC|Indian/Mahe", "SD|Africa/Khartoum", "SE|Europe/Stockholm", "SG|Asia/Singapore", "SH|Africa/Abidjan Atlantic/St_Helena", "SI|Europe/Belgrade Europe/Ljubljana", "SJ|Europe/Oslo Arctic/Longyearbyen", "SK|Europe/Prague Europe/Bratislava", "SL|Africa/Abidjan Africa/Freetown", "SM|Europe/Rome Europe/San_Marino", "SN|Africa/Abidjan Africa/Dakar", "SO|Africa/Nairobi Africa/Mogadishu", "SR|America/Paramaribo", "SS|Africa/Juba", "ST|Africa/Sao_Tome", "SV|America/El_Salvador", "SX|America/Curacao America/Lower_Princes", "SY|Asia/Damascus", "SZ|Africa/Johannesburg Africa/Mbabane", "TC|America/Grand_Turk", "TD|Africa/Ndjamena", "TF|Indian/Reunion Indian/Kerguelen", "TG|Africa/Abidjan Africa/Lome", "TH|Asia/Bangkok", "TJ|Asia/Dushanbe", "TK|Pacific/Fakaofo", "TL|Asia/Dili", "TM|Asia/Ashgabat", "TN|Africa/Tunis", "TO|Pacific/Tongatapu", "TR|Europe/Istanbul", "TT|America/Port_of_Spain", "TV|Pacific/Funafuti", "TW|Asia/Taipei", "TZ|Africa/Nairobi Africa/Dar_es_Salaam", "UA|Europe/Simferopol Europe/Kiev Europe/Uzhgorod Europe/Zaporozhye", "UG|Africa/Nairobi Africa/Kampala", "UM|Pacific/Pago_Pago Pacific/Wake Pacific/Honolulu Pacific/Midway", "US|America/New_York America/Detroit America/Kentucky/Louisville America/Kentucky/Monticello America/Indiana/Indianapolis America/Indiana/Vincennes America/Indiana/Winamac America/Indiana/Marengo America/Indiana/Petersburg America/Indiana/Vevay America/Chicago America/Indiana/Tell_City America/Indiana/Knox America/Menominee America/North_Dakota/Center America/North_Dakota/New_Salem America/North_Dakota/Beulah America/Denver America/Boise America/Phoenix America/Los_Angeles America/Anchorage America/Juneau America/Sitka America/Metlakatla America/Yakutat America/Nome America/Adak Pacific/Honolulu", "UY|America/Montevideo", "UZ|Asia/Samarkand Asia/Tashkent", "VA|Europe/Rome Europe/Vatican", "VC|America/Port_of_Spain America/St_Vincent", "VE|America/Caracas", "VG|America/Port_of_Spain America/Tortola", "VI|America/Port_of_Spain America/St_Thomas", "VN|Asia/Bangkok Asia/Ho_Chi_Minh", "VU|Pacific/Efate", "WF|Pacific/Wallis", "WS|Pacific/Apia", "YE|Asia/Riyadh Asia/Aden", "YT|Africa/Nairobi Indian/Mayotte", "ZA|Africa/Johannesburg", "ZM|Africa/Maputo Africa/Lusaka", "ZW|Africa/Maputo Africa/Harare"]
        }), c
    });