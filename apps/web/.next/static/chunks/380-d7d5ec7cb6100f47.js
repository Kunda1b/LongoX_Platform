"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [380],
  {
    421: (t, e, n) => {
      n.d(e, { hO: () => l, sG: () => s });
      var r = n(7620),
        i = n(7509),
        a = n(6118),
        o = n(4568),
        s = [
          "a",
          "button",
          "div",
          "form",
          "h2",
          "h3",
          "img",
          "input",
          "label",
          "li",
          "nav",
          "ol",
          "p",
          "select",
          "span",
          "svg",
          "ul",
        ].reduce((t, e) => {
          let n = (0, a.TL)(`Primitive.${e}`),
            i = r.forwardRef((t, r) => {
              let { asChild: i, ...a } = t;
              return (
                "undefined" != typeof window &&
                  (window[Symbol.for("radix-ui")] = !0),
                (0, o.jsx)(i ? n : e, { ...a, ref: r })
              );
            });
          return ((i.displayName = `Primitive.${e}`), { ...t, [e]: i });
        }, {});
      function l(t, e) {
        t && i.flushSync(() => t.dispatchEvent(e));
      }
    },
    1715: (t, e, n) => {
      n.d(e, { s: () => a });
      var r = n(7620);
      function i(t, e) {
        if ("function" == typeof t) return t(e);
        null != t && (t.current = e);
      }
      function a(...t) {
        return r.useCallback(
          (function (...t) {
            return (e) => {
              let n = !1,
                r = t.map((t) => {
                  let r = i(t, e);
                  return (n || "function" != typeof r || (n = !0), r);
                });
              if (n)
                return () => {
                  for (let e = 0; e < r.length; e++) {
                    let n = r[e];
                    "function" == typeof n ? n() : i(t[e], null);
                  }
                };
            };
          })(...t),
          t,
        );
      }
    },
    4111: (t, e, n) => {
      n.d(e, { i: () => s });
      var r,
        i = n(7620),
        a = n(7514),
        o =
          (r || (r = n.t(i, 2)))[" useInsertionEffect ".trim().toString()] ||
          a.N;
      function s({
        prop: t,
        defaultProp: e,
        onChange: n = () => {},
        caller: r,
      }) {
        let [a, s, l] = (function ({ defaultProp: t, onChange: e }) {
            let [n, r] = i.useState(t),
              a = i.useRef(n),
              s = i.useRef(e);
            return (
              o(() => {
                s.current = e;
              }, [e]),
              i.useEffect(() => {
                a.current !== n && (s.current?.(n), (a.current = n));
              }, [n, a]),
              [n, r, s]
            );
          })({ defaultProp: e, onChange: n }),
          u = void 0 !== t,
          c = u ? t : a;
        {
          let e = i.useRef(void 0 !== t);
          i.useEffect(() => {
            let t = e.current;
            if (t !== u) {
              let e = u ? "controlled" : "uncontrolled";
              console.warn(
                `${r} is changing from ${t ? "controlled" : "uncontrolled"} to ${e}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`,
              );
            }
            e.current = u;
          }, [u, r]);
        }
        return [
          c,
          i.useCallback(
            (e) => {
              if (u) {
                let n = "function" == typeof e ? e(t) : e;
                n !== t && l.current?.(n);
              } else s(e);
            },
            [u, t, s, l],
          ),
        ];
      }
      Symbol("RADIX:SYNC_STATE");
    },
    4185: (t, e, n) => {
      n.d(e, { X: () => a });
      var r = n(7620),
        i = n(7514);
      function a(t) {
        let [e, n] = r.useState(void 0);
        return (
          (0, i.N)(() => {
            if (t) {
              n({ width: t.offsetWidth, height: t.offsetHeight });
              let e = new ResizeObserver((e) => {
                let r, i;
                if (!Array.isArray(e) || !e.length) return;
                let a = e[0];
                if ("borderBoxSize" in a) {
                  let t = a.borderBoxSize,
                    e = Array.isArray(t) ? t[0] : t;
                  ((r = e.inlineSize), (i = e.blockSize));
                } else ((r = t.offsetWidth), (i = t.offsetHeight));
                n({ width: r, height: i });
              });
              return (
                e.observe(t, { box: "border-box" }),
                () => e.unobserve(t)
              );
            }
            n(void 0);
          }, [t]),
          e
        );
      }
    },
    4869: (t, e, n) => {
      n.d(e, { Ht: () => o });
      var r = n(7620),
        i = n(4568),
        a = r.createContext(void 0),
        o = (t) => {
          let { client: e, children: n } = t;
          return (
            r.useEffect(
              () => (
                e.mount(),
                () => {
                  e.unmount();
                }
              ),
              [e],
            ),
            (0, i.jsx)(a.Provider, { value: e, children: n })
          );
        };
    },
    6118: (t, e, n) => {
      n.d(e, { DX: () => s, Dc: () => u, TL: () => o });
      var r,
        i = n(7620),
        a = n(1715);
      function o(t) {
        let e = i.forwardRef((e, n) => {
          var r;
          let o,
            s,
            { children: u, ...d } = e,
            y = null,
            g = !1,
            v = [];
          (f(u) && "function" == typeof m && (u = m(u._payload)),
            i.Children.forEach(u, (t) => {
              var e;
              if (
                ((e = t),
                i.isValidElement(e) &&
                  "function" == typeof e.type &&
                  "__radixId" in e.type &&
                  e.type.__radixId === l)
              ) {
                g = !0;
                let e = "child" in t.props ? t.props.child : t.props.children;
                (f(e) && "function" == typeof m && (e = m(e._payload)),
                  (y = c(t, e)),
                  v.push(y?.props?.children));
              } else v.push(t);
            }),
            y
              ? (y = i.cloneElement(y, void 0, v))
              : !g &&
                1 === i.Children.count(u) &&
                i.isValidElement(u) &&
                (y = u));
          let b = y
              ? ((r = y),
                (s =
                  (o = Object.getOwnPropertyDescriptor(r.props, "ref")?.get) &&
                  "isReactWarning" in o &&
                  o.isReactWarning)
                  ? r.ref
                  : (s =
                        (o = Object.getOwnPropertyDescriptor(r, "ref")?.get) &&
                        "isReactWarning" in o &&
                        o.isReactWarning)
                    ? r.props.ref
                    : r.props.ref || r.ref)
              : void 0,
            w = (0, a.s)(n, b);
          if (!y) {
            if (u || 0 === u) throw Error(g ? p(t) : h(t));
            return u;
          }
          let x = (function (t, e) {
            let n = { ...e };
            for (let r in e) {
              let i = t[r],
                a = e[r];
              /^on[A-Z]/.test(r)
                ? i && a
                  ? (n[r] = (...t) => {
                      let e = a(...t);
                      return (i(...t), e);
                    })
                  : i && (n[r] = i)
                : "style" === r
                  ? (n[r] = { ...i, ...a })
                  : "className" === r &&
                    (n[r] = [i, a].filter(Boolean).join(" "));
            }
            return { ...t, ...n };
          })(d, y.props ?? {});
          return (
            y.type !== i.Fragment && (x.ref = n ? w : b),
            i.cloneElement(y, x)
          );
        });
        return ((e.displayName = `${t}.Slot`), e);
      }
      var s = o("Slot"),
        l = Symbol.for("radix.slottable");
      function u(t) {
        let e = (t) => ("child" in t ? t.children(t.child) : t.children);
        return ((e.displayName = `${t}.Slottable`), (e.__radixId = l), e);
      }
      var c = (t, e) => {
          if ("child" in t.props) {
            let e = t.props.child;
            return i.isValidElement(e)
              ? i.cloneElement(e, void 0, t.props.children(e.props.children))
              : null;
          }
          return i.isValidElement(e) ? e : null;
        },
        d = Symbol.for("react.lazy");
      function f(t) {
        var e;
        return (
          null != t &&
          "object" == typeof t &&
          "$$typeof" in t &&
          t.$$typeof === d &&
          "_payload" in t &&
          "object" == typeof (e = t._payload) &&
          null !== e &&
          "then" in e
        );
      }
      var h = (t) =>
          `${t} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
        p = (t) =>
          `${t} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
        m = (r || (r = n.t(i, 2)))[" use ".trim().toString()];
    },
    7231: (t, e, n) => {
      function r(t, e, { checkForDefaultPrevented: n = !0 } = {}) {
        return function (r) {
          if ((t?.(r), !1 === n || !r.defaultPrevented)) return e?.(r);
        };
      }
      (n.d(e, { mK: () => r }),
        "undefined" != typeof window &&
          window.document &&
          window.document.createElement);
    },
    7432: (t, e, n) => {
      n.d(e, { E: () => H });
      var r = {
          setTimeout: (t, e) => setTimeout(t, e),
          clearTimeout: (t) => clearTimeout(t),
          setInterval: (t, e) => setInterval(t, e),
          clearInterval: (t) => clearInterval(t),
        },
        i = new (class {
          #t = r;
          #e = !1;
          setTimeoutProvider(t) {
            this.#t = t;
          }
          setTimeout(t, e) {
            return this.#t.setTimeout(t, e);
          }
          clearTimeout(t) {
            this.#t.clearTimeout(t);
          }
          setInterval(t, e) {
            return this.#t.setInterval(t, e);
          }
          clearInterval(t) {
            this.#t.clearInterval(t);
          }
        })(),
        a = "undefined" == typeof window || "Deno" in globalThis;
      function o() {}
      function s(t, e) {
        return "function" == typeof t ? t(e) : t;
      }
      function l(t, e) {
        let {
          type: n = "all",
          exact: r,
          fetchStatus: i,
          predicate: a,
          queryKey: o,
          stale: s,
        } = t;
        if (o) {
          if (r) {
            if (e.queryHash !== c(o, e.options)) return !1;
          } else if (!f(e.queryKey, o)) return !1;
        }
        if ("all" !== n) {
          let t = e.isActive();
          if (("active" === n && !t) || ("inactive" === n && t)) return !1;
        }
        return (
          ("boolean" != typeof s || e.isStale() === s) &&
          (!i || i === e.state.fetchStatus) &&
          (!a || !!a(e))
        );
      }
      function u(t, e) {
        let { exact: n, status: r, predicate: i, mutationKey: a } = t;
        if (a) {
          if (!e.options.mutationKey) return !1;
          if (n) {
            if (d(e.options.mutationKey) !== d(a)) return !1;
          } else if (!f(e.options.mutationKey, a)) return !1;
        }
        return (!r || e.state.status === r) && (!i || !!i(e));
      }
      function c(t, e) {
        return (e?.queryKeyHashFn || d)(t);
      }
      function d(t) {
        return JSON.stringify(t, (t, e) =>
          m(e)
            ? Object.keys(e)
                .sort()
                .reduce((t, n) => ((t[n] = e[n]), t), {})
            : e,
        );
      }
      function f(t, e) {
        return (
          t === e ||
          (typeof t == typeof e &&
            !!t &&
            !!e &&
            "object" == typeof t &&
            "object" == typeof e &&
            Object.keys(e).every((n) => f(t[n], e[n])))
        );
      }
      var h = Object.prototype.hasOwnProperty;
      function p(t) {
        return Array.isArray(t) && t.length === Object.keys(t).length;
      }
      function m(t) {
        if (!y(t)) return !1;
        let e = t.constructor;
        if (void 0 === e) return !0;
        let n = e.prototype;
        return (
          !!y(n) &&
          !!n.hasOwnProperty("isPrototypeOf") &&
          Object.getPrototypeOf(t) === Object.prototype
        );
      }
      function y(t) {
        return "[object Object]" === Object.prototype.toString.call(t);
      }
      function g(t, e, n = 0) {
        let r = [...t, e];
        return n && r.length > n ? r.slice(1) : r;
      }
      function v(t, e, n = 0) {
        let r = [e, ...t];
        return n && r.length > n ? r.slice(0, -1) : r;
      }
      var b = Symbol();
      function w(t, e) {
        return !t.queryFn && e?.initialPromise
          ? () => e.initialPromise
          : t.queryFn && t.queryFn !== b
            ? t.queryFn
            : () => Promise.reject(Error(`Missing queryFn: '${t.queryHash}'`));
      }
      var x = function (t) {
          setTimeout(t, 0);
        },
        E = (function () {
          let t = [],
            e = 0,
            n = (t) => {
              t();
            },
            r = (t) => {
              t();
            },
            i = x,
            a = (r) => {
              e
                ? t.push(r)
                : i(() => {
                    n(r);
                  });
            };
          return {
            batch: (a) => {
              let o;
              e++;
              try {
                o = a();
              } finally {
                --e ||
                  (() => {
                    let e = t;
                    ((t = []),
                      e.length &&
                        i(() => {
                          r(() => {
                            e.forEach((t) => {
                              n(t);
                            });
                          });
                        }));
                  })();
              }
              return o;
            },
            batchCalls:
              (t) =>
              (...e) => {
                a(() => {
                  t(...e);
                });
              },
            schedule: a,
            setNotifyFunction: (t) => {
              n = t;
            },
            setBatchNotifyFunction: (t) => {
              r = t;
            },
            setScheduler: (t) => {
              i = t;
            },
          };
        })(),
        C = class {
          constructor() {
            ((this.listeners = new Set()),
              (this.subscribe = this.subscribe.bind(this)));
          }
          subscribe(t) {
            return (
              this.listeners.add(t),
              this.onSubscribe(),
              () => {
                (this.listeners.delete(t), this.onUnsubscribe());
              }
            );
          }
          hasListeners() {
            return this.listeners.size > 0;
          }
          onSubscribe() {}
          onUnsubscribe() {}
        },
        S = new (class extends C {
          #n;
          #r;
          #i;
          constructor() {
            (super(),
              (this.#i = (t) => {
                if ("undefined" != typeof window && window.addEventListener) {
                  let e = () => t();
                  return (
                    window.addEventListener("visibilitychange", e, !1),
                    () => {
                      window.removeEventListener("visibilitychange", e);
                    }
                  );
                }
              }));
          }
          onSubscribe() {
            this.#r || this.setEventListener(this.#i);
          }
          onUnsubscribe() {
            this.hasListeners() || (this.#r?.(), (this.#r = void 0));
          }
          setEventListener(t) {
            ((this.#i = t),
              this.#r?.(),
              (this.#r = t((t) => {
                "boolean" == typeof t ? this.setFocused(t) : this.onFocus();
              })));
          }
          setFocused(t) {
            this.#n !== t && ((this.#n = t), this.onFocus());
          }
          onFocus() {
            let t = this.isFocused();
            this.listeners.forEach((e) => {
              e(t);
            });
          }
          isFocused() {
            return "boolean" == typeof this.#n
              ? this.#n
              : globalThis.document?.visibilityState !== "hidden";
          }
        })(),
        T = new (class extends C {
          #a = !0;
          #r;
          #i;
          constructor() {
            (super(),
              (this.#i = (t) => {
                if ("undefined" != typeof window && window.addEventListener) {
                  let e = () => t(!0),
                    n = () => t(!1);
                  return (
                    window.addEventListener("online", e, !1),
                    window.addEventListener("offline", n, !1),
                    () => {
                      (window.removeEventListener("online", e),
                        window.removeEventListener("offline", n));
                    }
                  );
                }
              }));
          }
          onSubscribe() {
            this.#r || this.setEventListener(this.#i);
          }
          onUnsubscribe() {
            this.hasListeners() || (this.#r?.(), (this.#r = void 0));
          }
          setEventListener(t) {
            ((this.#i = t),
              this.#r?.(),
              (this.#r = t(this.setOnline.bind(this))));
          }
          setOnline(t) {
            this.#a !== t &&
              ((this.#a = t),
              this.listeners.forEach((e) => {
                e(t);
              }));
          }
          isOnline() {
            return this.#a;
          }
        })(),
        O = (() => {
          let t = () => a;
          return {
            isServer: () => t(),
            setIsServer(e) {
              t = e;
            },
          };
        })();
      function R(t) {
        return Math.min(1e3 * 2 ** t, 3e4);
      }
      function P(t) {
        return (t ?? "online") !== "online" || T.isOnline();
      }
      var A = class extends Error {
        constructor(t) {
          (super("CancelledError"),
            (this.revert = t?.revert),
            (this.silent = t?.silent));
        }
      };
      function k(t) {
        let e,
          n = !1,
          r = 0,
          a = (function () {
            let t,
              e,
              n = new Promise((n, r) => {
                ((t = n), (e = r));
              });
            function r(t) {
              (Object.assign(n, t), delete n.resolve, delete n.reject);
            }
            return (
              (n.status = "pending"),
              n.catch(() => {}),
              (n.resolve = (e) => {
                (r({ status: "fulfilled", value: e }), t(e));
              }),
              (n.reject = (t) => {
                (r({ status: "rejected", reason: t }), e(t));
              }),
              n
            );
          })(),
          o = () =>
            S.isFocused() &&
            ("always" === t.networkMode || T.isOnline()) &&
            t.canRun(),
          s = () => P(t.networkMode) && t.canRun(),
          l = (t) => {
            "pending" === a.status && (e?.(), a.resolve(t));
          },
          u = (t) => {
            "pending" === a.status && (e?.(), a.reject(t));
          },
          c = () =>
            new Promise((n) => {
              ((e = (t) => {
                ("pending" !== a.status || o()) && n(t);
              }),
                t.onPause?.());
            }).then(() => {
              ((e = void 0), "pending" === a.status && t.onContinue?.());
            }),
          d = () => {
            let e;
            if ("pending" !== a.status) return;
            let s = 0 === r ? t.initialPromise : void 0;
            try {
              e = s ?? t.fn();
            } catch (t) {
              e = Promise.reject(t);
            }
            Promise.resolve(e)
              .then(l)
              .catch((e) => {
                if ("pending" !== a.status) return;
                let s = t.retry ?? 3 * !O.isServer(),
                  l = t.retryDelay ?? R,
                  f = "function" == typeof l ? l(r, e) : l,
                  h =
                    !0 === s ||
                    ("number" == typeof s && r < s) ||
                    ("function" == typeof s && s(r, e));
                if (n || !h) return void u(e);
                (r++,
                  t.onFail?.(r, e),
                  new Promise((t) => {
                    i.setTimeout(t, f);
                  })
                    .then(() => (o() ? void 0 : c()))
                    .then(() => {
                      n ? u(e) : d();
                    }));
              });
          };
        return {
          promise: a,
          status: () => a.status,
          cancel: (e) => {
            if ("pending" === a.status) {
              let n = new A(e);
              (u(n), t.onCancel?.(n));
            }
          },
          continue: () => (e?.(), a),
          cancelRetry: () => {
            n = !0;
          },
          continueRetry: () => {
            n = !1;
          },
          canStart: s,
          start: () => (s() ? d() : c().then(d), a),
        };
      }
      var D = class {
        #o;
        destroy() {
          this.clearGcTimeout();
        }
        scheduleGc() {
          var t;
          (this.clearGcTimeout(),
            "number" == typeof (t = this.gcTime) &&
              t >= 0 &&
              t !== 1 / 0 &&
              (this.#o = i.setTimeout(() => {
                this.optionalRemove();
              }, this.gcTime)));
        }
        updateGcTime(t) {
          this.gcTime = Math.max(
            this.gcTime || 0,
            t ?? (O.isServer() ? 1 / 0 : 3e5),
          );
        }
        clearGcTimeout() {
          void 0 !== this.#o && (i.clearTimeout(this.#o), (this.#o = void 0));
        }
      };
      function M(t, { pages: e, pageParams: n }) {
        let r = e.length - 1;
        return e.length > 0 ? t.getNextPageParam(e[r], e, n[r], n) : void 0;
      }
      var N = class extends D {
        #s;
        #l;
        #u;
        #c;
        #d;
        #f;
        #h;
        #p;
        constructor(t) {
          (super(),
            (this.#p = !1),
            (this.#h = t.defaultOptions),
            this.setOptions(t.options),
            (this.observers = []),
            (this.#d = t.client),
            (this.#c = this.#d.getQueryCache()),
            (this.queryKey = t.queryKey),
            (this.queryHash = t.queryHash),
            (this.#l = j(this.options)),
            (this.state = t.state ?? this.#l),
            this.scheduleGc());
        }
        get meta() {
          return this.options.meta;
        }
        get queryType() {
          return this.#s;
        }
        get promise() {
          return this.#f?.promise;
        }
        setOptions(t) {
          if (
            ((this.options = { ...this.#h, ...t }),
            t?._type && (this.#s = t._type),
            this.updateGcTime(this.options.gcTime),
            this.state && void 0 === this.state.data)
          ) {
            let t = j(this.options);
            void 0 !== t.data &&
              (this.setState(L(t.data, t.dataUpdatedAt)), (this.#l = t));
          }
        }
        optionalRemove() {
          this.observers.length ||
            "idle" !== this.state.fetchStatus ||
            this.#c.remove(this);
        }
        setData(t, e) {
          var n, r;
          let i =
            ((n = this.state.data),
            "function" == typeof (r = this.options).structuralSharing
              ? r.structuralSharing(n, t)
              : !1 !== r.structuralSharing
                ? (function t(e, n, r = 0) {
                    if (e === n) return e;
                    if (r > 500) return n;
                    let i = p(e) && p(n);
                    if (!i && !(m(e) && m(n))) return n;
                    let a = (i ? e : Object.keys(e)).length,
                      o = i ? n : Object.keys(n),
                      s = o.length,
                      l = i ? Array(s) : {},
                      u = 0;
                    for (let c = 0; c < s; c++) {
                      let s = i ? c : o[c],
                        d = e[s],
                        f = n[s];
                      if (d === f) {
                        ((l[s] = d), (i ? c < a : h.call(e, s)) && u++);
                        continue;
                      }
                      if (
                        null === d ||
                        null === f ||
                        "object" != typeof d ||
                        "object" != typeof f
                      ) {
                        l[s] = f;
                        continue;
                      }
                      let p = t(d, f, r + 1);
                      ((l[s] = p), p === d && u++);
                    }
                    return a === s && u === a ? e : l;
                  })(n, t)
                : t);
          return (
            this.#m({
              data: i,
              type: "success",
              dataUpdatedAt: e?.updatedAt,
              manual: e?.manual,
            }),
            i
          );
        }
        setState(t) {
          this.#m({ type: "setState", state: t });
        }
        cancel(t) {
          let e = this.#f?.promise;
          return (
            this.#f?.cancel(t),
            e ? e.then(o).catch(o) : Promise.resolve()
          );
        }
        destroy() {
          (super.destroy(), this.cancel({ silent: !0 }));
        }
        get resetState() {
          return this.#l;
        }
        reset() {
          (this.destroy(), this.setState(this.resetState));
        }
        isActive() {
          return this.observers.some((t) => {
            var e;
            return (
              !1 !==
              ((e = t.options.enabled), "function" == typeof e ? e(this) : e)
            );
          });
        }
        isDisabled() {
          return this.getObserversCount() > 0
            ? !this.isActive()
            : this.options.queryFn === b || !this.isFetched();
        }
        isFetched() {
          return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
        }
        isStatic() {
          return (
            this.getObserversCount() > 0 &&
            this.observers.some(
              (t) => "static" === s(t.options.staleTime, this),
            )
          );
        }
        isStale() {
          return this.getObserversCount() > 0
            ? this.observers.some((t) => t.getCurrentResult().isStale)
            : void 0 === this.state.data || this.state.isInvalidated;
        }
        isStaleByTime(t = 0) {
          return (
            void 0 === this.state.data ||
            ("static" !== t &&
              (!!this.state.isInvalidated ||
                !Math.max(this.state.dataUpdatedAt + (t || 0) - Date.now(), 0)))
          );
        }
        onFocus() {
          let t = this.observers.find((t) => t.shouldFetchOnWindowFocus());
          (t?.refetch({ cancelRefetch: !1 }), this.#f?.continue());
        }
        onOnline() {
          let t = this.observers.find((t) => t.shouldFetchOnReconnect());
          (t?.refetch({ cancelRefetch: !1 }), this.#f?.continue());
        }
        addObserver(t) {
          this.observers.includes(t) ||
            (this.observers.push(t),
            this.clearGcTimeout(),
            this.#c.notify({
              type: "observerAdded",
              query: this,
              observer: t,
            }));
        }
        removeObserver(t) {
          this.observers.includes(t) &&
            ((this.observers = this.observers.filter((e) => e !== t)),
            this.observers.length ||
              (this.#f &&
                (this.#p || this.#y()
                  ? this.#f.cancel({ revert: !0 })
                  : this.#f.cancelRetry()),
              this.scheduleGc()),
            this.#c.notify({
              type: "observerRemoved",
              query: this,
              observer: t,
            }));
        }
        getObserversCount() {
          return this.observers.length;
        }
        #y() {
          return (
            "paused" === this.state.fetchStatus &&
            "pending" === this.state.status
          );
        }
        invalidate() {
          this.state.isInvalidated || this.#m({ type: "invalidate" });
        }
        async fetch(t, e) {
          var n;
          if (
            "idle" !== this.state.fetchStatus &&
            this.#f?.status() !== "rejected"
          ) {
            if (void 0 !== this.state.data && e?.cancelRefetch)
              this.cancel({ silent: !0 });
            else if (this.#f) return (this.#f.continueRetry(), this.#f.promise);
          }
          if ((t && this.setOptions(t), !this.options.queryFn)) {
            let t = this.observers.find((t) => t.options.queryFn);
            t && this.setOptions(t.options);
          }
          let r = new AbortController(),
            i = (t) => {
              Object.defineProperty(t, "signal", {
                enumerable: !0,
                get: () => ((this.#p = !0), r.signal),
              });
            },
            a = () => {
              let t = w(this.options, e),
                n = (() => {
                  let t = {
                    client: this.#d,
                    queryKey: this.queryKey,
                    meta: this.meta,
                  };
                  return (i(t), t);
                })();
              return ((this.#p = !1), this.options.persister)
                ? this.options.persister(t, n, this)
                : t(n);
            },
            o = (() => {
              let t = {
                fetchOptions: e,
                options: this.options,
                queryKey: this.queryKey,
                client: this.#d,
                state: this.state,
                fetchFn: a,
              };
              return (i(t), t);
            })(),
            s =
              "infinite" === this.#s
                ? ((n = this.options.pages),
                  {
                    onFetch: (t, e) => {
                      let r = t.options,
                        i = t.fetchOptions?.meta?.fetchMore?.direction,
                        a = t.state.data?.pages || [],
                        o = t.state.data?.pageParams || [],
                        s = { pages: [], pageParams: [] },
                        l = 0,
                        u = async () => {
                          let e = !1,
                            u = w(t.options, t.fetchOptions),
                            c = async (n, r, i) => {
                              if (e) return Promise.reject(t.signal.reason);
                              if (null == r && n.pages.length)
                                return Promise.resolve(n);
                              let a = (() => {
                                  var n, a;
                                  let o,
                                    s,
                                    l = {
                                      client: t.client,
                                      queryKey: t.queryKey,
                                      pageParam: r,
                                      direction: i ? "backward" : "forward",
                                      meta: t.options.meta,
                                    };
                                  return (
                                    (n = () => t.signal),
                                    (a = () => (e = !0)),
                                    (s = !1),
                                    Object.defineProperty(l, "signal", {
                                      enumerable: !0,
                                      get: () => (
                                        (o ??= n()),
                                        s ||
                                          ((s = !0),
                                          o.aborted
                                            ? a()
                                            : o.addEventListener("abort", a, {
                                                once: !0,
                                              })),
                                        o
                                      ),
                                    }),
                                    l
                                  );
                                })(),
                                o = await u(a),
                                { maxPages: s } = t.options,
                                l = i ? v : g;
                              return {
                                pages: l(n.pages, o, s),
                                pageParams: l(n.pageParams, r, s),
                              };
                            };
                          if (i && a.length) {
                            let t = "backward" === i,
                              e = { pages: a, pageParams: o },
                              n = (
                                t
                                  ? function (t, { pages: e, pageParams: n }) {
                                      return e.length > 0
                                        ? t.getPreviousPageParam?.(
                                            e[0],
                                            e,
                                            n[0],
                                            n,
                                          )
                                        : void 0;
                                    }
                                  : M
                              )(r, e);
                            s = await c(e, n, t);
                          } else {
                            let t = n ?? a.length;
                            do {
                              let t =
                                0 === l
                                  ? (o[0] ?? r.initialPageParam)
                                  : M(r, s);
                              if (l > 0 && null == t) break;
                              ((s = await c(s, t)), l++);
                            } while (l < t);
                          }
                          return s;
                        };
                      t.options.persister
                        ? (t.fetchFn = () =>
                            t.options.persister?.(
                              u,
                              {
                                client: t.client,
                                queryKey: t.queryKey,
                                meta: t.options.meta,
                                signal: t.signal,
                              },
                              e,
                            ))
                        : (t.fetchFn = u);
                    },
                  })
                : this.options.behavior;
          (s?.onFetch(o, this),
            (this.#u = this.state),
            ("idle" === this.state.fetchStatus ||
              this.state.fetchMeta !== o.fetchOptions?.meta) &&
              this.#m({ type: "fetch", meta: o.fetchOptions?.meta }),
            (this.#f = k({
              initialPromise: e?.initialPromise,
              fn: o.fetchFn,
              onCancel: (t) => {
                (t instanceof A &&
                  t.revert &&
                  this.setState({ ...this.#u, fetchStatus: "idle" }),
                  r.abort());
              },
              onFail: (t, e) => {
                this.#m({ type: "failed", failureCount: t, error: e });
              },
              onPause: () => {
                this.#m({ type: "pause" });
              },
              onContinue: () => {
                this.#m({ type: "continue" });
              },
              retry: o.options.retry,
              retryDelay: o.options.retryDelay,
              networkMode: o.options.networkMode,
              canRun: () => !0,
            })));
          try {
            let t = await this.#f.start();
            if (void 0 === t)
              throw Error(`${this.queryHash} data is undefined`);
            return (
              this.setData(t),
              this.#c.config.onSuccess?.(t, this),
              this.#c.config.onSettled?.(t, this.state.error, this),
              t
            );
          } catch (t) {
            if (t instanceof A) {
              if (t.silent) return this.#f.promise;
              else if (t.revert) {
                if (void 0 === this.state.data) throw t;
                return this.state.data;
              }
            }
            throw (
              this.#m({ type: "error", error: t }),
              this.#c.config.onError?.(t, this),
              this.#c.config.onSettled?.(this.state.data, t, this),
              t
            );
          } finally {
            this.scheduleGc();
          }
        }
        #m(t) {
          let e = (e) => {
            switch (t.type) {
              case "failed":
                return {
                  ...e,
                  fetchFailureCount: t.failureCount,
                  fetchFailureReason: t.error,
                };
              case "pause":
                return { ...e, fetchStatus: "paused" };
              case "continue":
                return { ...e, fetchStatus: "fetching" };
              case "fetch":
                var n;
                return {
                  ...e,
                  ...((n = e.data),
                  {
                    fetchFailureCount: 0,
                    fetchFailureReason: null,
                    fetchStatus: P(this.options.networkMode)
                      ? "fetching"
                      : "paused",
                    ...(void 0 === n && { error: null, status: "pending" }),
                  }),
                  fetchMeta: t.meta ?? null,
                };
              case "success":
                let r = {
                  ...e,
                  ...L(t.data, t.dataUpdatedAt),
                  dataUpdateCount: e.dataUpdateCount + 1,
                  ...(!t.manual && {
                    fetchStatus: "idle",
                    fetchFailureCount: 0,
                    fetchFailureReason: null,
                  }),
                };
                return ((this.#u = t.manual ? r : void 0), r);
              case "error":
                let i = t.error;
                return {
                  ...e,
                  error: i,
                  errorUpdateCount: e.errorUpdateCount + 1,
                  errorUpdatedAt: Date.now(),
                  fetchFailureCount: e.fetchFailureCount + 1,
                  fetchFailureReason: i,
                  fetchStatus: "idle",
                  status: "error",
                  isInvalidated: !0,
                };
              case "invalidate":
                return { ...e, isInvalidated: !0 };
              case "setState":
                return { ...e, ...t.state };
            }
          };
          ((this.state = e(this.state)),
            E.batch(() => {
              (this.observers.forEach((t) => {
                t.onQueryUpdate();
              }),
                this.#c.notify({ query: this, type: "updated", action: t }));
            }));
        }
      };
      function L(t, e) {
        return {
          data: t,
          dataUpdatedAt: e ?? Date.now(),
          error: null,
          isInvalidated: !1,
          status: "success",
        };
      }
      function j(t) {
        let e =
            "function" == typeof t.initialData
              ? t.initialData()
              : t.initialData,
          n = void 0 !== e,
          r = n
            ? "function" == typeof t.initialDataUpdatedAt
              ? t.initialDataUpdatedAt()
              : t.initialDataUpdatedAt
            : 0;
        return {
          data: e,
          dataUpdateCount: 0,
          dataUpdatedAt: n ? (r ?? Date.now()) : 0,
          error: null,
          errorUpdateCount: 0,
          errorUpdatedAt: 0,
          fetchFailureCount: 0,
          fetchFailureReason: null,
          fetchMeta: null,
          isInvalidated: !1,
          status: n ? "success" : "pending",
          fetchStatus: "idle",
        };
      }
      var F = class extends C {
          constructor(t = {}) {
            (super(), (this.config = t), (this.#g = new Map()));
          }
          #g;
          build(t, e, n) {
            let r = e.queryKey,
              i = e.queryHash ?? c(r, e),
              a = this.get(i);
            return (
              a ||
                ((a = new N({
                  client: t,
                  queryKey: r,
                  queryHash: i,
                  options: t.defaultQueryOptions(e),
                  state: n,
                  defaultOptions: t.getQueryDefaults(r),
                })),
                this.add(a)),
              a
            );
          }
          add(t) {
            this.#g.has(t.queryHash) ||
              (this.#g.set(t.queryHash, t),
              this.notify({ type: "added", query: t }));
          }
          remove(t) {
            let e = this.#g.get(t.queryHash);
            e &&
              (t.destroy(),
              e === t && this.#g.delete(t.queryHash),
              this.notify({ type: "removed", query: t }));
          }
          clear() {
            E.batch(() => {
              this.getAll().forEach((t) => {
                this.remove(t);
              });
            });
          }
          get(t) {
            return this.#g.get(t);
          }
          getAll() {
            return [...this.#g.values()];
          }
          find(t) {
            let e = { exact: !0, ...t };
            return this.getAll().find((t) => l(e, t));
          }
          findAll(t = {}) {
            let e = this.getAll();
            return Object.keys(t).length > 0 ? e.filter((e) => l(t, e)) : e;
          }
          notify(t) {
            E.batch(() => {
              this.listeners.forEach((e) => {
                e(t);
              });
            });
          }
          onFocus() {
            E.batch(() => {
              this.getAll().forEach((t) => {
                t.onFocus();
              });
            });
          }
          onOnline() {
            E.batch(() => {
              this.getAll().forEach((t) => {
                t.onOnline();
              });
            });
          }
        },
        q = class extends D {
          #d;
          #v;
          #b;
          #f;
          constructor(t) {
            (super(),
              (this.#d = t.client),
              (this.mutationId = t.mutationId),
              (this.#b = t.mutationCache),
              (this.#v = []),
              (this.state = t.state || {
                context: void 0,
                data: void 0,
                error: null,
                failureCount: 0,
                failureReason: null,
                isPaused: !1,
                status: "idle",
                variables: void 0,
                submittedAt: 0,
              }),
              this.setOptions(t.options),
              this.scheduleGc());
          }
          setOptions(t) {
            ((this.options = t), this.updateGcTime(this.options.gcTime));
          }
          get meta() {
            return this.options.meta;
          }
          addObserver(t) {
            this.#v.includes(t) ||
              (this.#v.push(t),
              this.clearGcTimeout(),
              this.#b.notify({
                type: "observerAdded",
                mutation: this,
                observer: t,
              }));
          }
          removeObserver(t) {
            ((this.#v = this.#v.filter((e) => e !== t)),
              this.scheduleGc(),
              this.#b.notify({
                type: "observerRemoved",
                mutation: this,
                observer: t,
              }));
          }
          optionalRemove() {
            this.#v.length ||
              ("pending" === this.state.status
                ? this.scheduleGc()
                : this.#b.remove(this));
          }
          continue() {
            return this.#f?.continue() ?? this.execute(this.state.variables);
          }
          async execute(t) {
            let e = () => {
                this.#m({ type: "continue" });
              },
              n = {
                client: this.#d,
                meta: this.options.meta,
                mutationKey: this.options.mutationKey,
              };
            this.#f = k({
              fn: () =>
                this.options.mutationFn
                  ? this.options.mutationFn(t, n)
                  : Promise.reject(Error("No mutationFn found")),
              onFail: (t, e) => {
                this.#m({ type: "failed", failureCount: t, error: e });
              },
              onPause: () => {
                this.#m({ type: "pause" });
              },
              onContinue: e,
              retry: this.options.retry ?? 0,
              retryDelay: this.options.retryDelay,
              networkMode: this.options.networkMode,
              canRun: () => this.#b.canRun(this),
            });
            let r = "pending" === this.state.status,
              i = !this.#f.canStart();
            try {
              if (r) e();
              else {
                (this.#m({ type: "pending", variables: t, isPaused: i }),
                  this.#b.config.onMutate &&
                    (await this.#b.config.onMutate(t, this, n)));
                let e = await this.options.onMutate?.(t, n);
                e !== this.state.context &&
                  this.#m({
                    type: "pending",
                    context: e,
                    variables: t,
                    isPaused: i,
                  });
              }
              let a = await this.#f.start();
              return (
                await this.#b.config.onSuccess?.(
                  a,
                  t,
                  this.state.context,
                  this,
                  n,
                ),
                await this.options.onSuccess?.(a, t, this.state.context, n),
                await this.#b.config.onSettled?.(
                  a,
                  null,
                  this.state.variables,
                  this.state.context,
                  this,
                  n,
                ),
                await this.options.onSettled?.(
                  a,
                  null,
                  t,
                  this.state.context,
                  n,
                ),
                this.#m({ type: "success", data: a }),
                a
              );
            } catch (e) {
              try {
                await this.#b.config.onError?.(
                  e,
                  t,
                  this.state.context,
                  this,
                  n,
                );
              } catch (t) {
                Promise.reject(t);
              }
              try {
                await this.options.onError?.(e, t, this.state.context, n);
              } catch (t) {
                Promise.reject(t);
              }
              try {
                await this.#b.config.onSettled?.(
                  void 0,
                  e,
                  this.state.variables,
                  this.state.context,
                  this,
                  n,
                );
              } catch (t) {
                Promise.reject(t);
              }
              try {
                await this.options.onSettled?.(
                  void 0,
                  e,
                  t,
                  this.state.context,
                  n,
                );
              } catch (t) {
                Promise.reject(t);
              }
              throw (this.#m({ type: "error", error: e }), e);
            } finally {
              this.#b.runNext(this);
            }
          }
          #m(t) {
            ((this.state = ((e) => {
              switch (t.type) {
                case "failed":
                  return {
                    ...e,
                    failureCount: t.failureCount,
                    failureReason: t.error,
                  };
                case "pause":
                  return { ...e, isPaused: !0 };
                case "continue":
                  return { ...e, isPaused: !1 };
                case "pending":
                  return {
                    ...e,
                    context: t.context,
                    data: void 0,
                    failureCount: 0,
                    failureReason: null,
                    error: null,
                    isPaused: t.isPaused,
                    status: "pending",
                    variables: t.variables,
                    submittedAt: Date.now(),
                  };
                case "success":
                  return {
                    ...e,
                    data: t.data,
                    failureCount: 0,
                    failureReason: null,
                    error: null,
                    status: "success",
                    isPaused: !1,
                  };
                case "error":
                  return {
                    ...e,
                    data: void 0,
                    error: t.error,
                    failureCount: e.failureCount + 1,
                    failureReason: t.error,
                    isPaused: !1,
                    status: "error",
                  };
              }
            })(this.state)),
              E.batch(() => {
                (this.#v.forEach((e) => {
                  e.onMutationUpdate(t);
                }),
                  this.#b.notify({
                    mutation: this,
                    type: "updated",
                    action: t,
                  }));
              }));
          }
        },
        I = class extends C {
          constructor(t = {}) {
            (super(),
              (this.config = t),
              (this.#w = new Set()),
              (this.#x = new Map()),
              (this.#E = 0));
          }
          #w;
          #x;
          #E;
          build(t, e, n) {
            let r = new q({
              client: t,
              mutationCache: this,
              mutationId: ++this.#E,
              options: t.defaultMutationOptions(e),
              state: n,
            });
            return (this.add(r), r);
          }
          add(t) {
            this.#w.add(t);
            let e = B(t);
            if ("string" == typeof e) {
              let n = this.#x.get(e);
              n ? n.push(t) : this.#x.set(e, [t]);
            }
            this.notify({ type: "added", mutation: t });
          }
          remove(t) {
            if (this.#w.delete(t)) {
              let e = B(t);
              if ("string" == typeof e) {
                let n = this.#x.get(e);
                if (n)
                  if (n.length > 1) {
                    let e = n.indexOf(t);
                    -1 !== e && n.splice(e, 1);
                  } else n[0] === t && this.#x.delete(e);
              }
            }
            this.notify({ type: "removed", mutation: t });
          }
          canRun(t) {
            let e = B(t);
            if ("string" != typeof e) return !0;
            {
              let n = this.#x.get(e),
                r = n?.find((t) => "pending" === t.state.status);
              return !r || r === t;
            }
          }
          runNext(t) {
            let e = B(t);
            if ("string" != typeof e) return Promise.resolve();
            {
              let n = this.#x.get(e)?.find((e) => e !== t && e.state.isPaused);
              return n?.continue() ?? Promise.resolve();
            }
          }
          clear() {
            E.batch(() => {
              (this.#w.forEach((t) => {
                this.notify({ type: "removed", mutation: t });
              }),
                this.#w.clear(),
                this.#x.clear());
            });
          }
          getAll() {
            return Array.from(this.#w);
          }
          find(t) {
            let e = { exact: !0, ...t };
            return this.getAll().find((t) => u(e, t));
          }
          findAll(t = {}) {
            return this.getAll().filter((e) => u(t, e));
          }
          notify(t) {
            E.batch(() => {
              this.listeners.forEach((e) => {
                e(t);
              });
            });
          }
          resumePausedMutations() {
            let t = this.getAll().filter((t) => t.state.isPaused);
            return E.batch(() =>
              Promise.all(t.map((t) => t.continue().catch(o))),
            );
          }
        };
      function B(t) {
        return t.options.scope?.id;
      }
      var H = class {
        #C;
        #b;
        #h;
        #S;
        #T;
        #O;
        #R;
        #P;
        constructor(t = {}) {
          ((this.#C = t.queryCache || new F()),
            (this.#b = t.mutationCache || new I()),
            (this.#h = t.defaultOptions || {}),
            (this.#S = new Map()),
            (this.#T = new Map()),
            (this.#O = 0));
        }
        mount() {
          (this.#O++,
            1 === this.#O &&
              ((this.#R = S.subscribe(async (t) => {
                t && (await this.resumePausedMutations(), this.#C.onFocus());
              })),
              (this.#P = T.subscribe(async (t) => {
                t && (await this.resumePausedMutations(), this.#C.onOnline());
              }))));
        }
        unmount() {
          (this.#O--,
            0 === this.#O &&
              (this.#R?.(),
              (this.#R = void 0),
              this.#P?.(),
              (this.#P = void 0)));
        }
        isFetching(t) {
          return this.#C.findAll({ ...t, fetchStatus: "fetching" }).length;
        }
        isMutating(t) {
          return this.#b.findAll({ ...t, status: "pending" }).length;
        }
        getQueryData(t) {
          let e = this.defaultQueryOptions({ queryKey: t });
          return this.#C.get(e.queryHash)?.state.data;
        }
        ensureQueryData(t) {
          let e = this.defaultQueryOptions(t),
            n = this.#C.build(this, e),
            r = n.state.data;
          return void 0 === r
            ? this.fetchQuery(t)
            : (t.revalidateIfStale &&
                n.isStaleByTime(s(e.staleTime, n)) &&
                this.prefetchQuery(e),
              Promise.resolve(r));
        }
        getQueriesData(t) {
          return this.#C
            .findAll(t)
            .map(({ queryKey: t, state: e }) => [t, e.data]);
        }
        setQueryData(t, e, n) {
          let r = this.defaultQueryOptions({ queryKey: t }),
            i = this.#C.get(r.queryHash),
            a = i?.state.data,
            o = "function" == typeof e ? e(a) : e;
          if (void 0 !== o)
            return this.#C.build(this, r).setData(o, { ...n, manual: !0 });
        }
        setQueriesData(t, e, n) {
          return E.batch(() =>
            this.#C
              .findAll(t)
              .map(({ queryKey: t }) => [t, this.setQueryData(t, e, n)]),
          );
        }
        getQueryState(t) {
          let e = this.defaultQueryOptions({ queryKey: t });
          return this.#C.get(e.queryHash)?.state;
        }
        removeQueries(t) {
          let e = this.#C;
          E.batch(() => {
            e.findAll(t).forEach((t) => {
              e.remove(t);
            });
          });
        }
        resetQueries(t, e) {
          let n = this.#C;
          return E.batch(
            () => (
              n.findAll(t).forEach((t) => {
                t.reset();
              }),
              this.refetchQueries({ type: "active", ...t }, e)
            ),
          );
        }
        cancelQueries(t, e = {}) {
          let n = { revert: !0, ...e };
          return Promise.all(
            E.batch(() => this.#C.findAll(t).map((t) => t.cancel(n))),
          )
            .then(o)
            .catch(o);
        }
        invalidateQueries(t, e = {}) {
          return E.batch(() =>
            (this.#C.findAll(t).forEach((t) => {
              t.invalidate();
            }),
            t?.refetchType === "none")
              ? Promise.resolve()
              : this.refetchQueries(
                  { ...t, type: t?.refetchType ?? t?.type ?? "active" },
                  e,
                ),
          );
        }
        refetchQueries(t, e = {}) {
          let n = { ...e, cancelRefetch: e.cancelRefetch ?? !0 };
          return Promise.all(
            E.batch(() =>
              this.#C
                .findAll(t)
                .filter((t) => !t.isDisabled() && !t.isStatic())
                .map((t) => {
                  let e = t.fetch(void 0, n);
                  return (
                    n.throwOnError || (e = e.catch(o)),
                    "paused" === t.state.fetchStatus ? Promise.resolve() : e
                  );
                }),
            ),
          ).then(o);
        }
        fetchQuery(t) {
          let e = this.defaultQueryOptions(t);
          void 0 === e.retry && (e.retry = !1);
          let n = this.#C.build(this, e);
          return n.isStaleByTime(s(e.staleTime, n))
            ? n.fetch(e)
            : Promise.resolve(n.state.data);
        }
        prefetchQuery(t) {
          return this.fetchQuery(t).then(o).catch(o);
        }
        fetchInfiniteQuery(t) {
          return ((t._type = "infinite"), this.fetchQuery(t));
        }
        prefetchInfiniteQuery(t) {
          return this.fetchInfiniteQuery(t).then(o).catch(o);
        }
        ensureInfiniteQueryData(t) {
          return ((t._type = "infinite"), this.ensureQueryData(t));
        }
        resumePausedMutations() {
          return T.isOnline()
            ? this.#b.resumePausedMutations()
            : Promise.resolve();
        }
        getQueryCache() {
          return this.#C;
        }
        getMutationCache() {
          return this.#b;
        }
        getDefaultOptions() {
          return this.#h;
        }
        setDefaultOptions(t) {
          this.#h = t;
        }
        setQueryDefaults(t, e) {
          this.#S.set(d(t), { queryKey: t, defaultOptions: e });
        }
        getQueryDefaults(t) {
          let e = [...this.#S.values()],
            n = {};
          return (
            e.forEach((e) => {
              f(t, e.queryKey) && Object.assign(n, e.defaultOptions);
            }),
            n
          );
        }
        setMutationDefaults(t, e) {
          this.#T.set(d(t), { mutationKey: t, defaultOptions: e });
        }
        getMutationDefaults(t) {
          let e = [...this.#T.values()],
            n = {};
          return (
            e.forEach((e) => {
              f(t, e.mutationKey) && Object.assign(n, e.defaultOptions);
            }),
            n
          );
        }
        defaultQueryOptions(t) {
          if (t._defaulted) return t;
          let e = {
            ...this.#h.queries,
            ...this.getQueryDefaults(t.queryKey),
            ...t,
            _defaulted: !0,
          };
          return (
            e.queryHash || (e.queryHash = c(e.queryKey, e)),
            void 0 === e.refetchOnReconnect &&
              (e.refetchOnReconnect = "always" !== e.networkMode),
            void 0 === e.throwOnError && (e.throwOnError = !!e.suspense),
            !e.networkMode && e.persister && (e.networkMode = "offlineFirst"),
            e.queryFn === b && (e.enabled = !1),
            e
          );
        }
        defaultMutationOptions(t) {
          return t?._defaulted
            ? t
            : {
                ...this.#h.mutations,
                ...(t?.mutationKey && this.getMutationDefaults(t.mutationKey)),
                ...t,
                _defaulted: !0,
              };
        }
        clear() {
          (this.#C.clear(), this.#b.clear());
        }
      };
    },
    7514: (t, e, n) => {
      n.d(e, { N: () => i });
      var r = n(7620),
        i = globalThis?.document ? r.useLayoutEffect : () => {};
    },
    7541: (t, e, n) => {
      var r = n(3041);
      (n.o(r, "usePathname") &&
        n.d(e, {
          usePathname: function () {
            return r.usePathname;
          },
        }),
        n.o(r, "useRouter") &&
          n.d(e, {
            useRouter: function () {
              return r.useRouter;
            },
          }));
    },
    8107: (t, e, n) => {
      n.d(e, { A: () => a });
      var r = n(7620),
        i = n(4568);
      function a(t, e = []) {
        let n = [],
          o = () => {
            let e = n.map((t) => r.createContext(t));
            return function (n) {
              let i = n?.[t] || e;
              return r.useMemo(
                () => ({ [`__scope${t}`]: { ...n, [t]: i } }),
                [n, i],
              );
            };
          };
        return (
          (o.scopeName = t),
          [
            function (e, a) {
              let o = r.createContext(a);
              o.displayName = e + "Context";
              let s = n.length;
              n = [...n, a];
              let l = (e) => {
                let { scope: n, children: a, ...l } = e,
                  u = n?.[t]?.[s] || o,
                  c = r.useMemo(() => l, Object.values(l));
                return (0, i.jsx)(u.Provider, { value: c, children: a });
              };
              return (
                (l.displayName = e + "Provider"),
                [
                  l,
                  function (n, i) {
                    let l = i?.[t]?.[s] || o,
                      u = r.useContext(l);
                    if (u) return u;
                    if (void 0 !== a) return a;
                    throw Error(`\`${n}\` must be used within \`${e}\``);
                  },
                ]
              );
            },
            (function (...t) {
              let e = t[0];
              if (1 === t.length) return e;
              let n = () => {
                let n = t.map((t) => ({
                  useScope: t(),
                  scopeName: t.scopeName,
                }));
                return function (t) {
                  let i = n.reduce((e, { useScope: n, scopeName: r }) => {
                    let i = n(t)[`__scope${r}`];
                    return { ...e, ...i };
                  }, {});
                  return r.useMemo(
                    () => ({ [`__scope${e.scopeName}`]: i }),
                    [i],
                  );
                };
              };
              return ((n.scopeName = e.scopeName), n);
            })(o, ...e),
          ]
        );
      }
    },
    9153: (t, e, n) => {
      let r;
      n.d(e, {
        UC: () => eM,
        ZL: () => eD,
        Kq: () => eP,
        bL: () => eA,
        l9: () => ek,
      });
      var i,
        a = n(7620),
        o = n.t(a, 2),
        s = n(7231),
        l = n(1715),
        u = n(8107),
        c = n(421);
      function d(t) {
        let e = a.useRef(t);
        return (
          a.useEffect(() => {
            e.current = t;
          }),
          a.useMemo(
            () =>
              (...t) =>
                e.current?.(...t),
            [],
          )
        );
      }
      var f = n(4568),
        h = "dismissableLayer.update",
        p = a.createContext({
          layers: new Set(),
          layersWithOutsidePointerEventsDisabled: new Set(),
          branches: new Set(),
        }),
        m = a.forwardRef((t, e) => {
          var n, r;
          let {
              disableOutsidePointerEvents: o = !1,
              onEscapeKeyDown: u,
              onPointerDownOutside: m,
              onFocusOutside: v,
              onInteractOutside: b,
              onDismiss: w,
              ...x
            } = t,
            E = a.useContext(p),
            [C, S] = a.useState(null),
            T =
              null != (r = null == C ? void 0 : C.ownerDocument)
                ? r
                : null == (n = globalThis)
                  ? void 0
                  : n.document,
            [, O] = a.useState({}),
            R = (0, l.s)(e, (t) => S(t)),
            P = Array.from(E.layers),
            [A] = [...E.layersWithOutsidePointerEventsDisabled].slice(-1),
            k = P.indexOf(A),
            D = C ? P.indexOf(C) : -1,
            M = E.layersWithOutsidePointerEventsDisabled.size > 0,
            N = D >= k,
            L = (function (t) {
              var e;
              let n =
                  arguments.length > 1 && void 0 !== arguments[1]
                    ? arguments[1]
                    : null == (e = globalThis)
                      ? void 0
                      : e.document,
                r = d(t),
                i = a.useRef(!1),
                o = a.useRef(() => {});
              return (
                a.useEffect(() => {
                  let t = (t) => {
                      if (t.target && !i.current) {
                        let e = function () {
                            g("dismissableLayer.pointerDownOutside", r, i, {
                              discrete: !0,
                            });
                          },
                          i = { originalEvent: t };
                        "touch" === t.pointerType
                          ? (n.removeEventListener("click", o.current),
                            (o.current = e),
                            n.addEventListener("click", o.current, {
                              once: !0,
                            }))
                          : e();
                      } else n.removeEventListener("click", o.current);
                      i.current = !1;
                    },
                    e = window.setTimeout(() => {
                      n.addEventListener("pointerdown", t);
                    }, 0);
                  return () => {
                    (window.clearTimeout(e),
                      n.removeEventListener("pointerdown", t),
                      n.removeEventListener("click", o.current));
                  };
                }, [n, r]),
                { onPointerDownCapture: () => (i.current = !0) }
              );
            })((t) => {
              let e = t.target,
                n = [...E.branches].some((t) => t.contains(e));
              N &&
                !n &&
                (null == m || m(t),
                null == b || b(t),
                t.defaultPrevented || null == w || w());
            }, T),
            j = (function (t) {
              var e;
              let n =
                  arguments.length > 1 && void 0 !== arguments[1]
                    ? arguments[1]
                    : null == (e = globalThis)
                      ? void 0
                      : e.document,
                r = d(t),
                i = a.useRef(!1);
              return (
                a.useEffect(() => {
                  let t = (t) => {
                    t.target &&
                      !i.current &&
                      g(
                        "dismissableLayer.focusOutside",
                        r,
                        { originalEvent: t },
                        { discrete: !1 },
                      );
                  };
                  return (
                    n.addEventListener("focusin", t),
                    () => n.removeEventListener("focusin", t)
                  );
                }, [n, r]),
                {
                  onFocusCapture: () => (i.current = !0),
                  onBlurCapture: () => (i.current = !1),
                }
              );
            })((t) => {
              let e = t.target;
              ![...E.branches].some((t) => t.contains(e)) &&
                (null == v || v(t),
                null == b || b(t),
                t.defaultPrevented || null == w || w());
            }, T);
          return (
            !(function (t, e = globalThis?.document) {
              let n = d(t);
              a.useEffect(() => {
                let t = (t) => {
                  "Escape" === t.key && n(t);
                };
                return (
                  e.addEventListener("keydown", t, { capture: !0 }),
                  () => e.removeEventListener("keydown", t, { capture: !0 })
                );
              }, [n, e]);
            })((t) => {
              D === E.layers.size - 1 &&
                (null == u || u(t),
                !t.defaultPrevented && w && (t.preventDefault(), w()));
            }, T),
            a.useEffect(() => {
              if (C)
                return (
                  o &&
                    (0 === E.layersWithOutsidePointerEventsDisabled.size &&
                      ((i = T.body.style.pointerEvents),
                      (T.body.style.pointerEvents = "none")),
                    E.layersWithOutsidePointerEventsDisabled.add(C)),
                  E.layers.add(C),
                  y(),
                  () => {
                    o &&
                      (E.layersWithOutsidePointerEventsDisabled.delete(C),
                      0 === E.layersWithOutsidePointerEventsDisabled.size &&
                        (T.body.style.pointerEvents = i));
                  }
                );
            }, [C, T, o, E]),
            a.useEffect(
              () => () => {
                C &&
                  (E.layers.delete(C),
                  E.layersWithOutsidePointerEventsDisabled.delete(C),
                  y());
              },
              [C, E],
            ),
            a.useEffect(() => {
              let t = () => O({});
              return (
                document.addEventListener(h, t),
                () => document.removeEventListener(h, t)
              );
            }, []),
            (0, f.jsx)(c.sG.div, {
              ...x,
              ref: R,
              style: {
                pointerEvents: M ? (N ? "auto" : "none") : void 0,
                ...t.style,
              },
              onFocusCapture: (0, s.mK)(t.onFocusCapture, j.onFocusCapture),
              onBlurCapture: (0, s.mK)(t.onBlurCapture, j.onBlurCapture),
              onPointerDownCapture: (0, s.mK)(
                t.onPointerDownCapture,
                L.onPointerDownCapture,
              ),
            })
          );
        });
      function y() {
        let t = new CustomEvent(h);
        document.dispatchEvent(t);
      }
      function g(t, e, n, r) {
        let { discrete: i } = r,
          a = n.originalEvent.target,
          o = new CustomEvent(t, { bubbles: !1, cancelable: !0, detail: n });
        (e && a.addEventListener(t, e, { once: !0 }),
          i ? (0, c.hO)(a, o) : a.dispatchEvent(o));
      }
      ((m.displayName = "DismissableLayer"),
        (a.forwardRef((t, e) => {
          let n = a.useContext(p),
            r = a.useRef(null),
            i = (0, l.s)(e, r);
          return (
            a.useEffect(() => {
              let t = r.current;
              if (t)
                return (
                  n.branches.add(t),
                  () => {
                    n.branches.delete(t);
                  }
                );
            }, [n.branches]),
            (0, f.jsx)(c.sG.div, { ...t, ref: i })
          );
        }).displayName = "DismissableLayerBranch"));
      var v = n(7514),
        b = o[" useId ".trim().toString()] || (() => void 0),
        w = 0;
      let x = ["top", "right", "bottom", "left"],
        E = Math.min,
        C = Math.max,
        S = Math.round,
        T = Math.floor,
        O = (t) => ({ x: t, y: t }),
        R = { left: "right", right: "left", bottom: "top", top: "bottom" };
      function P(t, e) {
        return "function" == typeof t ? t(e) : t;
      }
      function A(t) {
        return t.split("-")[0];
      }
      function k(t) {
        return t.split("-")[1];
      }
      function D(t) {
        return "x" === t ? "y" : "x";
      }
      function M(t) {
        return "y" === t ? "height" : "width";
      }
      function N(t) {
        let e = t[0];
        return "t" === e || "b" === e ? "y" : "x";
      }
      function L(t) {
        return t.includes("start")
          ? t.replace("start", "end")
          : t.replace("end", "start");
      }
      let j = ["left", "right"],
        F = ["right", "left"],
        q = ["top", "bottom"],
        I = ["bottom", "top"];
      function B(t) {
        let e = A(t);
        return R[e] + t.slice(e.length);
      }
      function H(t) {
        return "number" != typeof t
          ? { top: 0, right: 0, bottom: 0, left: 0, ...t }
          : { top: t, right: t, bottom: t, left: t };
      }
      function _(t) {
        let { x: e, y: n, width: r, height: i } = t;
        return {
          width: r,
          height: i,
          top: n,
          left: e,
          right: e + r,
          bottom: n + i,
          x: e,
          y: n,
        };
      }
      function z(t, e, n) {
        let r,
          { reference: i, floating: a } = t,
          o = N(e),
          s = D(N(e)),
          l = M(s),
          u = A(e),
          c = "y" === o,
          d = i.x + i.width / 2 - a.width / 2,
          f = i.y + i.height / 2 - a.height / 2,
          h = i[l] / 2 - a[l] / 2;
        switch (u) {
          case "top":
            r = { x: d, y: i.y - a.height };
            break;
          case "bottom":
            r = { x: d, y: i.y + i.height };
            break;
          case "right":
            r = { x: i.x + i.width, y: f };
            break;
          case "left":
            r = { x: i.x - a.width, y: f };
            break;
          default:
            r = { x: i.x, y: i.y };
        }
        switch (k(e)) {
          case "start":
            r[s] -= h * (n && c ? -1 : 1);
            break;
          case "end":
            r[s] += h * (n && c ? -1 : 1);
        }
        return r;
      }
      async function U(t, e) {
        var n;
        void 0 === e && (e = {});
        let { x: r, y: i, platform: a, rects: o, elements: s, strategy: l } = t,
          {
            boundary: u = "clippingAncestors",
            rootBoundary: c = "viewport",
            elementContext: d = "floating",
            altBoundary: f = !1,
            padding: h = 0,
          } = P(e, t),
          p = H(h),
          m = s[f ? ("floating" === d ? "reference" : "floating") : d],
          y = _(
            await a.getClippingRect({
              element:
                null ==
                  (n = await (null == a.isElement ? void 0 : a.isElement(m))) ||
                n
                  ? m
                  : m.contextElement ||
                    (await (null == a.getDocumentElement
                      ? void 0
                      : a.getDocumentElement(s.floating))),
              boundary: u,
              rootBoundary: c,
              strategy: l,
            }),
          ),
          g =
            "floating" === d
              ? {
                  x: r,
                  y: i,
                  width: o.floating.width,
                  height: o.floating.height,
                }
              : o.reference,
          v = await (null == a.getOffsetParent
            ? void 0
            : a.getOffsetParent(s.floating)),
          b = ((await (null == a.isElement ? void 0 : a.isElement(v))) &&
            (await (null == a.getScale ? void 0 : a.getScale(v)))) || {
            x: 1,
            y: 1,
          },
          w = _(
            a.convertOffsetParentRelativeRectToViewportRelativeRect
              ? await a.convertOffsetParentRelativeRectToViewportRelativeRect({
                  elements: s,
                  rect: g,
                  offsetParent: v,
                  strategy: l,
                })
              : g,
          );
        return {
          top: (y.top - w.top + p.top) / b.y,
          bottom: (w.bottom - y.bottom + p.bottom) / b.y,
          left: (y.left - w.left + p.left) / b.x,
          right: (w.right - y.right + p.right) / b.x,
        };
      }
      let Q = async (t, e, n) => {
        let {
            placement: r = "bottom",
            strategy: i = "absolute",
            middleware: a = [],
            platform: o,
          } = n,
          s = o.detectOverflow ? o : { ...o, detectOverflow: U },
          l = await (null == o.isRTL ? void 0 : o.isRTL(e)),
          u = await o.getElementRects({
            reference: t,
            floating: e,
            strategy: i,
          }),
          { x: c, y: d } = z(u, r, l),
          f = r,
          h = 0,
          p = {};
        for (let n = 0; n < a.length; n++) {
          let m = a[n];
          if (!m) continue;
          let { name: y, fn: g } = m,
            {
              x: v,
              y: b,
              data: w,
              reset: x,
            } = await g({
              x: c,
              y: d,
              initialPlacement: r,
              placement: f,
              strategy: i,
              middlewareData: p,
              rects: u,
              platform: s,
              elements: { reference: t, floating: e },
            });
          ((c = null != v ? v : c),
            (d = null != b ? b : d),
            (p[y] = { ...p[y], ...w }),
            x &&
              h < 50 &&
              (h++,
              "object" == typeof x &&
                (x.placement && (f = x.placement),
                x.rects &&
                  (u =
                    !0 === x.rects
                      ? await o.getElementRects({
                          reference: t,
                          floating: e,
                          strategy: i,
                        })
                      : x.rects),
                ({ x: c, y: d } = z(u, f, l))),
              (n = -1)));
        }
        return { x: c, y: d, placement: f, strategy: i, middlewareData: p };
      };
      function K(t, e) {
        return {
          top: t.top - e.height,
          right: t.right - e.width,
          bottom: t.bottom - e.height,
          left: t.left - e.width,
        };
      }
      function W(t) {
        return x.some((e) => t[e] >= 0);
      }
      let Y = new Set(["left", "top"]);
      async function $(t, e) {
        let { placement: n, platform: r, elements: i } = t,
          a = await (null == r.isRTL ? void 0 : r.isRTL(i.floating)),
          o = A(n),
          s = k(n),
          l = "y" === N(n),
          u = Y.has(o) ? -1 : 1,
          c = a && l ? -1 : 1,
          d = P(e, t),
          {
            mainAxis: f,
            crossAxis: h,
            alignmentAxis: p,
          } = "number" == typeof d
            ? { mainAxis: d, crossAxis: 0, alignmentAxis: null }
            : {
                mainAxis: d.mainAxis || 0,
                crossAxis: d.crossAxis || 0,
                alignmentAxis: d.alignmentAxis,
              };
        return (
          s && "number" == typeof p && (h = "end" === s ? -1 * p : p),
          l ? { x: h * c, y: f * u } : { x: f * u, y: h * c }
        );
      }
      function V() {
        return "undefined" != typeof window;
      }
      function G(t) {
        return J(t) ? (t.nodeName || "").toLowerCase() : "#document";
      }
      function X(t) {
        var e;
        return (
          (null == t || null == (e = t.ownerDocument)
            ? void 0
            : e.defaultView) || window
        );
      }
      function Z(t) {
        var e;
        return null ==
          (e = (J(t) ? t.ownerDocument : t.document) || window.document)
          ? void 0
          : e.documentElement;
      }
      function J(t) {
        return !!V() && (t instanceof Node || t instanceof X(t).Node);
      }
      function tt(t) {
        return !!V() && (t instanceof Element || t instanceof X(t).Element);
      }
      function te(t) {
        return (
          !!V() && (t instanceof HTMLElement || t instanceof X(t).HTMLElement)
        );
      }
      function tn(t) {
        return (
          !!V() &&
          "undefined" != typeof ShadowRoot &&
          (t instanceof ShadowRoot || t instanceof X(t).ShadowRoot)
        );
      }
      function tr(t) {
        let { overflow: e, overflowX: n, overflowY: r, display: i } = td(t);
        return (
          /auto|scroll|overlay|hidden|clip/.test(e + r + n) &&
          "inline" !== i &&
          "contents" !== i
        );
      }
      function ti(t) {
        try {
          if (t.matches(":popover-open")) return !0;
        } catch (t) {}
        try {
          return t.matches(":modal");
        } catch (t) {
          return !1;
        }
      }
      let ta = /transform|translate|scale|rotate|perspective|filter/,
        to = /paint|layout|strict|content/,
        ts = (t) => !!t && "none" !== t;
      function tl(t) {
        let e = tt(t) ? td(t) : t;
        return (
          ts(e.transform) ||
          ts(e.translate) ||
          ts(e.scale) ||
          ts(e.rotate) ||
          ts(e.perspective) ||
          (!tu() && (ts(e.backdropFilter) || ts(e.filter))) ||
          ta.test(e.willChange || "") ||
          to.test(e.contain || "")
        );
      }
      function tu() {
        return (
          null == r &&
            (r =
              "undefined" != typeof CSS &&
              CSS.supports &&
              CSS.supports("-webkit-backdrop-filter", "none")),
          r
        );
      }
      function tc(t) {
        return /^(html|body|#document)$/.test(G(t));
      }
      function td(t) {
        return X(t).getComputedStyle(t);
      }
      function tf(t) {
        return tt(t)
          ? { scrollLeft: t.scrollLeft, scrollTop: t.scrollTop }
          : { scrollLeft: t.scrollX, scrollTop: t.scrollY };
      }
      function th(t) {
        if ("html" === G(t)) return t;
        let e = t.assignedSlot || t.parentNode || (tn(t) && t.host) || Z(t);
        return tn(e) ? e.host : e;
      }
      function tp(t, e, n) {
        var r;
        (void 0 === e && (e = []), void 0 === n && (n = !0));
        let i = (function t(e) {
            let n = th(e);
            return tc(n)
              ? e.ownerDocument
                ? e.ownerDocument.body
                : e.body
              : te(n) && tr(n)
                ? n
                : t(n);
          })(t),
          a = i === (null == (r = t.ownerDocument) ? void 0 : r.body),
          o = X(i);
        if (!a) return e.concat(i, tp(i, [], n));
        {
          let t = tm(o);
          return e.concat(
            o,
            o.visualViewport || [],
            tr(i) ? i : [],
            t && n ? tp(t) : [],
          );
        }
      }
      function tm(t) {
        return t.parent && Object.getPrototypeOf(t.parent)
          ? t.frameElement
          : null;
      }
      function ty(t) {
        let e = td(t),
          n = parseFloat(e.width) || 0,
          r = parseFloat(e.height) || 0,
          i = te(t),
          a = i ? t.offsetWidth : n,
          o = i ? t.offsetHeight : r,
          s = S(n) !== a || S(r) !== o;
        return (s && ((n = a), (r = o)), { width: n, height: r, $: s });
      }
      function tg(t) {
        return tt(t) ? t : t.contextElement;
      }
      function tv(t) {
        let e = tg(t);
        if (!te(e)) return O(1);
        let n = e.getBoundingClientRect(),
          { width: r, height: i, $: a } = ty(e),
          o = (a ? S(n.width) : n.width) / r,
          s = (a ? S(n.height) : n.height) / i;
        return (
          (o && Number.isFinite(o)) || (o = 1),
          (s && Number.isFinite(s)) || (s = 1),
          { x: o, y: s }
        );
      }
      let tb = O(0);
      function tw(t) {
        let e = X(t);
        return tu() && e.visualViewport
          ? { x: e.visualViewport.offsetLeft, y: e.visualViewport.offsetTop }
          : tb;
      }
      function tx(t, e, n, r) {
        var i;
        (void 0 === e && (e = !1), void 0 === n && (n = !1));
        let a = t.getBoundingClientRect(),
          o = tg(t),
          s = O(1);
        e && (r ? tt(r) && (s = tv(r)) : (s = tv(t)));
        let l = (void 0 === (i = n) && (i = !1), r && (!i || r === X(o)) && i)
            ? tw(o)
            : O(0),
          u = (a.left + l.x) / s.x,
          c = (a.top + l.y) / s.y,
          d = a.width / s.x,
          f = a.height / s.y;
        if (o) {
          let t = X(o),
            e = r && tt(r) ? X(r) : r,
            n = t,
            i = tm(n);
          for (; i && r && e !== n; ) {
            let t = tv(i),
              e = i.getBoundingClientRect(),
              r = td(i),
              a = e.left + (i.clientLeft + parseFloat(r.paddingLeft)) * t.x,
              o = e.top + (i.clientTop + parseFloat(r.paddingTop)) * t.y;
            ((u *= t.x),
              (c *= t.y),
              (d *= t.x),
              (f *= t.y),
              (u += a),
              (c += o),
              (i = tm((n = X(i)))));
          }
        }
        return _({ width: d, height: f, x: u, y: c });
      }
      function tE(t, e) {
        let n = tf(t).scrollLeft;
        return e ? e.left + n : tx(Z(t)).left + n;
      }
      function tC(t, e) {
        let n = t.getBoundingClientRect();
        return { x: n.left + e.scrollLeft - tE(t, n), y: n.top + e.scrollTop };
      }
      function tS(t, e, n) {
        let r;
        if ("viewport" === e)
          r = (function (t, e) {
            let n = X(t),
              r = Z(t),
              i = n.visualViewport,
              a = r.clientWidth,
              o = r.clientHeight,
              s = 0,
              l = 0;
            if (i) {
              ((a = i.width), (o = i.height));
              let t = tu();
              (!t || (t && "fixed" === e)) &&
                ((s = i.offsetLeft), (l = i.offsetTop));
            }
            let u = tE(r);
            if (u <= 0) {
              let t = r.ownerDocument,
                e = t.body,
                n = getComputedStyle(e),
                i =
                  ("CSS1Compat" === t.compatMode &&
                    parseFloat(n.marginLeft) + parseFloat(n.marginRight)) ||
                  0,
                o = Math.abs(r.clientWidth - e.clientWidth - i);
              o <= 25 && (a -= o);
            } else u <= 25 && (a += u);
            return { width: a, height: o, x: s, y: l };
          })(t, n);
        else if ("document" === e)
          r = (function (t) {
            let e = Z(t),
              n = tf(t),
              r = t.ownerDocument.body,
              i = C(e.scrollWidth, e.clientWidth, r.scrollWidth, r.clientWidth),
              a = C(
                e.scrollHeight,
                e.clientHeight,
                r.scrollHeight,
                r.clientHeight,
              ),
              o = -n.scrollLeft + tE(t),
              s = -n.scrollTop;
            return (
              "rtl" === td(r).direction &&
                (o += C(e.clientWidth, r.clientWidth) - i),
              { width: i, height: a, x: o, y: s }
            );
          })(Z(t));
        else if (tt(e))
          r = (function (t, e) {
            let n = tx(t, !0, "fixed" === e),
              r = n.top + t.clientTop,
              i = n.left + t.clientLeft,
              a = te(t) ? tv(t) : O(1),
              o = t.clientWidth * a.x,
              s = t.clientHeight * a.y;
            return { width: o, height: s, x: i * a.x, y: r * a.y };
          })(e, n);
        else {
          let n = tw(t);
          r = { x: e.x - n.x, y: e.y - n.y, width: e.width, height: e.height };
        }
        return _(r);
      }
      function tT(t) {
        return "static" === td(t).position;
      }
      function tO(t, e) {
        if (!te(t) || "fixed" === td(t).position) return null;
        if (e) return e(t);
        let n = t.offsetParent;
        return (Z(t) === n && (n = n.ownerDocument.body), n);
      }
      function tR(t, e) {
        var n;
        let r = X(t);
        if (ti(t)) return r;
        if (!te(t)) {
          let e = th(t);
          for (; e && !tc(e); ) {
            if (tt(e) && !tT(e)) return e;
            e = th(e);
          }
          return r;
        }
        let i = tO(t, e);
        for (; i && ((n = i), /^(table|td|th)$/.test(G(n))) && tT(i); )
          i = tO(i, e);
        return i && tc(i) && tT(i) && !tl(i)
          ? r
          : i ||
              (function (t) {
                let e = th(t);
                for (; te(e) && !tc(e); ) {
                  if (tl(e)) return e;
                  if (ti(e)) break;
                  e = th(e);
                }
                return null;
              })(t) ||
              r;
      }
      let tP = async function (t) {
          let e = this.getOffsetParent || tR,
            n = this.getDimensions,
            r = await n(t.floating);
          return {
            reference: (function (t, e, n) {
              let r = te(e),
                i = Z(e),
                a = "fixed" === n,
                o = tx(t, !0, a, e),
                s = { scrollLeft: 0, scrollTop: 0 },
                l = O(0);
              if (r || (!r && !a))
                if ((("body" !== G(e) || tr(i)) && (s = tf(e)), r)) {
                  let t = tx(e, !0, a, e);
                  ((l.x = t.x + e.clientLeft), (l.y = t.y + e.clientTop));
                } else i && (l.x = tE(i));
              a && !r && i && (l.x = tE(i));
              let u = !i || r || a ? O(0) : tC(i, s);
              return {
                x: o.left + s.scrollLeft - l.x - u.x,
                y: o.top + s.scrollTop - l.y - u.y,
                width: o.width,
                height: o.height,
              };
            })(t.reference, await e(t.floating), t.strategy),
            floating: { x: 0, y: 0, width: r.width, height: r.height },
          };
        },
        tA = {
          convertOffsetParentRelativeRectToViewportRelativeRect: function (t) {
            let { elements: e, rect: n, offsetParent: r, strategy: i } = t,
              a = "fixed" === i,
              o = Z(r),
              s = !!e && ti(e.floating);
            if (r === o || (s && a)) return n;
            let l = { scrollLeft: 0, scrollTop: 0 },
              u = O(1),
              c = O(0),
              d = te(r);
            if (
              (d || (!d && !a)) &&
              (("body" !== G(r) || tr(o)) && (l = tf(r)), d)
            ) {
              let t = tx(r);
              ((u = tv(r)),
                (c.x = t.x + r.clientLeft),
                (c.y = t.y + r.clientTop));
            }
            let f = !o || d || a ? O(0) : tC(o, l);
            return {
              width: n.width * u.x,
              height: n.height * u.y,
              x: n.x * u.x - l.scrollLeft * u.x + c.x + f.x,
              y: n.y * u.y - l.scrollTop * u.y + c.y + f.y,
            };
          },
          getDocumentElement: Z,
          getClippingRect: function (t) {
            let { element: e, boundary: n, rootBoundary: r, strategy: i } = t,
              a = [
                ...("clippingAncestors" === n
                  ? ti(e)
                    ? []
                    : (function (t, e) {
                        let n = e.get(t);
                        if (n) return n;
                        let r = tp(t, [], !1).filter(
                            (t) => tt(t) && "body" !== G(t),
                          ),
                          i = null,
                          a = "fixed" === td(t).position,
                          o = a ? th(t) : t;
                        for (; tt(o) && !tc(o); ) {
                          let e = td(o),
                            n = tl(o);
                          (n || "fixed" !== e.position || (i = null),
                            (
                              a
                                ? n || i
                                : !(
                                    (!n &&
                                      "static" === e.position &&
                                      i &&
                                      ("absolute" === i.position ||
                                        "fixed" === i.position)) ||
                                    (tr(o) &&
                                      !n &&
                                      (function t(e, n) {
                                        let r = th(e);
                                        return (
                                          !(r === n || !tt(r) || tc(r)) &&
                                          ("fixed" === td(r).position ||
                                            t(r, n))
                                        );
                                      })(t, o))
                                  )
                            )
                              ? (i = e)
                              : (r = r.filter((t) => t !== o)),
                            (o = th(o)));
                        }
                        return (e.set(t, r), r);
                      })(e, this._c)
                  : [].concat(n)),
                r,
              ],
              o = tS(e, a[0], i),
              s = o.top,
              l = o.right,
              u = o.bottom,
              c = o.left;
            for (let t = 1; t < a.length; t++) {
              let n = tS(e, a[t], i);
              ((s = C(n.top, s)),
                (l = E(n.right, l)),
                (u = E(n.bottom, u)),
                (c = C(n.left, c)));
            }
            return { width: l - c, height: u - s, x: c, y: s };
          },
          getOffsetParent: tR,
          getElementRects: tP,
          getClientRects: function (t) {
            return Array.from(t.getClientRects());
          },
          getDimensions: function (t) {
            let { width: e, height: n } = ty(t);
            return { width: e, height: n };
          },
          getScale: tv,
          isElement: tt,
          isRTL: function (t) {
            return "rtl" === td(t).direction;
          },
        };
      function tk(t, e) {
        return (
          t.x === e.x &&
          t.y === e.y &&
          t.width === e.width &&
          t.height === e.height
        );
      }
      let tD = (t) => ({
        name: "arrow",
        options: t,
        async fn(e) {
          let {
              x: n,
              y: r,
              placement: i,
              rects: a,
              platform: o,
              elements: s,
              middlewareData: l,
            } = e,
            { element: u, padding: c = 0 } = P(t, e) || {};
          if (null == u) return {};
          let d = H(c),
            f = { x: n, y: r },
            h = D(N(i)),
            p = M(h),
            m = await o.getDimensions(u),
            y = "y" === h,
            g = y ? "clientHeight" : "clientWidth",
            v = a.reference[p] + a.reference[h] - f[h] - a.floating[p],
            b = f[h] - a.reference[h],
            w = await (null == o.getOffsetParent
              ? void 0
              : o.getOffsetParent(u)),
            x = w ? w[g] : 0;
          (x && (await (null == o.isElement ? void 0 : o.isElement(w)))) ||
            (x = s.floating[g] || a.floating[p]);
          let S = x / 2 - m[p] / 2 - 1,
            T = E(d[y ? "top" : "left"], S),
            O = E(d[y ? "bottom" : "right"], S),
            R = x - m[p] - O,
            A = x / 2 - m[p] / 2 + (v / 2 - b / 2),
            L = C(T, E(A, R)),
            j =
              !l.arrow &&
              null != k(i) &&
              A !== L &&
              a.reference[p] / 2 - (A < T ? T : O) - m[p] / 2 < 0,
            F = j ? (A < T ? A - T : A - R) : 0;
          return {
            [h]: f[h] + F,
            data: {
              [h]: L,
              centerOffset: A - L - F,
              ...(j && { alignmentOffset: F }),
            },
            reset: j,
          };
        },
      });
      var tM = n(7509),
        tN =
          "undefined" != typeof document ? a.useLayoutEffect : function () {};
      function tL(t, e) {
        let n, r, i;
        if (t === e) return !0;
        if (typeof t != typeof e) return !1;
        if ("function" == typeof t && t.toString() === e.toString()) return !0;
        if (t && e && "object" == typeof t) {
          if (Array.isArray(t)) {
            if ((n = t.length) !== e.length) return !1;
            for (r = n; 0 != r--; ) if (!tL(t[r], e[r])) return !1;
            return !0;
          }
          if ((n = (i = Object.keys(t)).length) !== Object.keys(e).length)
            return !1;
          for (r = n; 0 != r--; )
            if (!{}.hasOwnProperty.call(e, i[r])) return !1;
          for (r = n; 0 != r--; ) {
            let n = i[r];
            if (("_owner" !== n || !t.$$typeof) && !tL(t[n], e[n])) return !1;
          }
          return !0;
        }
        return t != t && e != e;
      }
      function tj(t) {
        return "undefined" == typeof window
          ? 1
          : (t.ownerDocument.defaultView || window).devicePixelRatio || 1;
      }
      function tF(t, e) {
        let n = tj(t);
        return Math.round(e * n) / n;
      }
      function tq(t) {
        let e = a.useRef(t);
        return (
          tN(() => {
            e.current = t;
          }),
          e
        );
      }
      var tI = a.forwardRef((t, e) => {
        let { children: n, width: r = 10, height: i = 5, ...a } = t;
        return (0, f.jsx)(c.sG.svg, {
          ...a,
          ref: e,
          width: r,
          height: i,
          viewBox: "0 0 30 10",
          preserveAspectRatio: "none",
          children: t.asChild
            ? n
            : (0, f.jsx)("polygon", { points: "0,0 30,0 15,10" }),
        });
      });
      tI.displayName = "Arrow";
      var tB = n(4185),
        tH = "Popper",
        [t_, tz] = (0, u.A)(tH),
        [tU, tQ] = t_(tH),
        tK = (t) => {
          let { __scopePopper: e, children: n } = t,
            [r, i] = a.useState(null),
            [o, s] = a.useState(void 0);
          return (0, f.jsx)(tU, {
            scope: e,
            anchor: r,
            onAnchorChange: i,
            placementState: o,
            setPlacementState: s,
            children: n,
          });
        };
      tK.displayName = tH;
      var tW = "PopperAnchor",
        tY = a.forwardRef((t, e) => {
          let { __scopePopper: n, virtualRef: r, ...i } = t,
            o = tQ(tW, n),
            s = a.useRef(null),
            u = o.onAnchorChange,
            d = a.useCallback(
              (t) => {
                ((s.current = t), t && u(t));
              },
              [u],
            ),
            h = (0, l.s)(e, d),
            p = a.useRef(null);
          a.useEffect(() => {
            if (!r) return;
            let t = p.current;
            ((p.current = r.current), t !== p.current && u(p.current));
          });
          let m = o.placementState && t5(o.placementState),
            y = null == m ? void 0 : m[0],
            g = null == m ? void 0 : m[1];
          return r
            ? null
            : (0, f.jsx)(c.sG.div, {
                "data-radix-popper-side": y,
                "data-radix-popper-align": g,
                ...i,
                ref: h,
              });
        });
      tY.displayName = tW;
      var t$ = "PopperContent",
        [tV, tG] = t_(t$),
        tX = a.forwardRef((t, e) => {
          var n, r, i, o, s, u, h, p;
          let {
              __scopePopper: m,
              side: y = "bottom",
              sideOffset: g = 0,
              align: b = "center",
              alignOffset: w = 0,
              arrowPadding: x = 0,
              avoidCollisions: S = !0,
              collisionBoundary: O,
              collisionPadding: R = 0,
              sticky: H = "partial",
              hideWhenDetached: _ = !1,
              updatePositionStrategy: z = "optimized",
              onPlaced: U,
              ...V
            } = t,
            G = tQ(t$, m),
            [X, J] = a.useState(null),
            tt = (0, l.s)(e, (t) => J(t)),
            [te, tn] = a.useState(null),
            tr = (0, tB.X)(te),
            ti = null != (h = null == tr ? void 0 : tr.width) ? h : 0,
            ta = null != (p = null == tr ? void 0 : tr.height) ? p : 0,
            to =
              "number" == typeof R
                ? R
                : { top: 0, right: 0, bottom: 0, left: 0, ...R },
            ts = O ? (Array.isArray(O) ? O : [O]) : void 0,
            tl = void 0 !== ts && ts.length > 0,
            tu = {
              padding: to,
              boundary: null == ts ? void 0 : ts.filter(t1),
              altBoundary: tl,
            },
            {
              refs: tc,
              floatingStyles: td,
              placement: tf,
              isPositioned: th,
              middlewareData: tm,
            } = (function (t) {
              void 0 === t && (t = {});
              let {
                  placement: e = "bottom",
                  strategy: n = "absolute",
                  middleware: r = [],
                  platform: i,
                  elements: { reference: o, floating: s } = {},
                  transform: l = !0,
                  whileElementsMounted: u,
                  open: c,
                } = t,
                [d, f] = a.useState({
                  x: 0,
                  y: 0,
                  strategy: n,
                  placement: e,
                  middlewareData: {},
                  isPositioned: !1,
                }),
                [h, p] = a.useState(r);
              tL(h, r) || p(r);
              let [m, y] = a.useState(null),
                [g, v] = a.useState(null),
                b = a.useCallback((t) => {
                  t !== C.current && ((C.current = t), y(t));
                }, []),
                w = a.useCallback((t) => {
                  t !== S.current && ((S.current = t), v(t));
                }, []),
                x = o || m,
                E = s || g,
                C = a.useRef(null),
                S = a.useRef(null),
                T = a.useRef(d),
                O = null != u,
                R = tq(u),
                P = tq(i),
                A = tq(c),
                k = a.useCallback(() => {
                  if (!C.current || !S.current) return;
                  let t = { placement: e, strategy: n, middleware: h };
                  (P.current && (t.platform = P.current),
                    ((t, e, n) => {
                      let r = new Map(),
                        i = { platform: tA, ...n },
                        a = { ...i.platform, _c: r };
                      return Q(t, e, { ...i, platform: a });
                    })(C.current, S.current, t).then((t) => {
                      let e = { ...t, isPositioned: !1 !== A.current };
                      D.current &&
                        !tL(T.current, e) &&
                        ((T.current = e),
                        tM.flushSync(() => {
                          f(e);
                        }));
                    }));
                }, [h, e, n, P, A]);
              tN(() => {
                !1 === c &&
                  T.current.isPositioned &&
                  ((T.current.isPositioned = !1),
                  f((t) => ({ ...t, isPositioned: !1 })));
              }, [c]);
              let D = a.useRef(!1);
              (tN(
                () => (
                  (D.current = !0),
                  () => {
                    D.current = !1;
                  }
                ),
                [],
              ),
                tN(() => {
                  if ((x && (C.current = x), E && (S.current = E), x && E)) {
                    if (R.current) return R.current(x, E, k);
                    k();
                  }
                }, [x, E, k, R, O]));
              let M = a.useMemo(
                  () => ({
                    reference: C,
                    floating: S,
                    setReference: b,
                    setFloating: w,
                  }),
                  [b, w],
                ),
                N = a.useMemo(() => ({ reference: x, floating: E }), [x, E]),
                L = a.useMemo(() => {
                  let t = { position: n, left: 0, top: 0 };
                  if (!N.floating) return t;
                  let e = tF(N.floating, d.x),
                    r = tF(N.floating, d.y);
                  return l
                    ? {
                        ...t,
                        transform: "translate(" + e + "px, " + r + "px)",
                        ...(tj(N.floating) >= 1.5 && {
                          willChange: "transform",
                        }),
                      }
                    : { position: n, left: e, top: r };
                }, [n, l, N.floating, d.x, d.y]);
              return a.useMemo(
                () => ({
                  ...d,
                  update: k,
                  refs: M,
                  elements: N,
                  floatingStyles: L,
                }),
                [d, k, M, N, L],
              );
            })({
              strategy: "fixed",
              placement: y + ("center" !== b ? "-" + b : ""),
              whileElementsMounted: function () {
                for (var t = arguments.length, e = Array(t), n = 0; n < t; n++)
                  e[n] = arguments[n];
                return (function (t, e, n, r) {
                  let i;
                  void 0 === r && (r = {});
                  let {
                      ancestorScroll: a = !0,
                      ancestorResize: o = !0,
                      elementResize: s = "function" == typeof ResizeObserver,
                      layoutShift: l = "function" ==
                        typeof IntersectionObserver,
                      animationFrame: u = !1,
                    } = r,
                    c = tg(t),
                    d =
                      a || o ? [...(c ? tp(c) : []), ...(e ? tp(e) : [])] : [];
                  d.forEach((t) => {
                    (a && t.addEventListener("scroll", n, { passive: !0 }),
                      o && t.addEventListener("resize", n));
                  });
                  let f =
                      c && l
                        ? (function (t, e) {
                            let n,
                              r = null,
                              i = Z(t);
                            function a() {
                              var t;
                              (clearTimeout(n),
                                null == (t = r) || t.disconnect(),
                                (r = null));
                            }
                            return (
                              !(function o(s, l) {
                                (void 0 === s && (s = !1),
                                  void 0 === l && (l = 1),
                                  a());
                                let u = t.getBoundingClientRect(),
                                  { left: c, top: d, width: f, height: h } = u;
                                if ((s || e(), !f || !h)) return;
                                let p = T(d),
                                  m = T(i.clientWidth - (c + f)),
                                  y = {
                                    rootMargin:
                                      -p +
                                      "px " +
                                      -m +
                                      "px " +
                                      -T(i.clientHeight - (d + h)) +
                                      "px " +
                                      -T(c) +
                                      "px",
                                    threshold: C(0, E(1, l)) || 1,
                                  },
                                  g = !0;
                                function v(e) {
                                  let r = e[0].intersectionRatio;
                                  if (r !== l) {
                                    if (!g) return o();
                                    r
                                      ? o(!1, r)
                                      : (n = setTimeout(() => {
                                          o(!1, 1e-7);
                                        }, 1e3));
                                  }
                                  (1 !== r ||
                                    tk(u, t.getBoundingClientRect()) ||
                                    o(),
                                    (g = !1));
                                }
                                try {
                                  r = new IntersectionObserver(v, {
                                    ...y,
                                    root: i.ownerDocument,
                                  });
                                } catch (t) {
                                  r = new IntersectionObserver(v, y);
                                }
                                r.observe(t);
                              })(!0),
                              a
                            );
                          })(c, n)
                        : null,
                    h = -1,
                    p = null;
                  s &&
                    ((p = new ResizeObserver((t) => {
                      let [r] = t;
                      (r &&
                        r.target === c &&
                        p &&
                        e &&
                        (p.unobserve(e),
                        cancelAnimationFrame(h),
                        (h = requestAnimationFrame(() => {
                          var t;
                          null == (t = p) || t.observe(e);
                        }))),
                        n());
                    })),
                    c && !u && p.observe(c),
                    e && p.observe(e));
                  let m = u ? tx(t) : null;
                  return (
                    u &&
                      (function e() {
                        let r = tx(t);
                        (m && !tk(m, r) && n(),
                          (m = r),
                          (i = requestAnimationFrame(e)));
                      })(),
                    n(),
                    () => {
                      var t;
                      (d.forEach((t) => {
                        (a && t.removeEventListener("scroll", n),
                          o && t.removeEventListener("resize", n));
                      }),
                        null == f || f(),
                        null == (t = p) || t.disconnect(),
                        (p = null),
                        u && cancelAnimationFrame(i));
                    }
                  );
                })(...e, { animationFrame: "always" === z });
              },
              elements: { reference: G.anchor },
              middleware: [
                ((t, e) => {
                  let n = (function (t) {
                    return (
                      void 0 === t && (t = 0),
                      {
                        name: "offset",
                        options: t,
                        async fn(e) {
                          var n, r;
                          let {
                              x: i,
                              y: a,
                              placement: o,
                              middlewareData: s,
                            } = e,
                            l = await $(e, t);
                          return o ===
                            (null == (n = s.offset) ? void 0 : n.placement) &&
                            null != (r = s.arrow) &&
                            r.alignmentOffset
                            ? {}
                            : {
                                x: i + l.x,
                                y: a + l.y,
                                data: { ...l, placement: o },
                              };
                        },
                      }
                    );
                  })(t);
                  return { name: n.name, fn: n.fn, options: [t, e] };
                })({ mainAxis: g + ta, alignmentAxis: w }),
                S &&
                  ((t, e) => {
                    let n = (function (t) {
                      return (
                        void 0 === t && (t = {}),
                        {
                          name: "shift",
                          options: t,
                          async fn(e) {
                            let { x: n, y: r, placement: i, platform: a } = e,
                              {
                                mainAxis: o = !0,
                                crossAxis: s = !1,
                                limiter: l = {
                                  fn: (t) => {
                                    let { x: e, y: n } = t;
                                    return { x: e, y: n };
                                  },
                                },
                                ...u
                              } = P(t, e),
                              c = { x: n, y: r },
                              d = await a.detectOverflow(e, u),
                              f = N(A(i)),
                              h = D(f),
                              p = c[h],
                              m = c[f];
                            if (o) {
                              let t = "y" === h ? "top" : "left",
                                e = "y" === h ? "bottom" : "right",
                                n = p + d[t],
                                r = p - d[e];
                              p = C(n, E(p, r));
                            }
                            if (s) {
                              let t = "y" === f ? "top" : "left",
                                e = "y" === f ? "bottom" : "right",
                                n = m + d[t],
                                r = m - d[e];
                              m = C(n, E(m, r));
                            }
                            let y = l.fn({ ...e, [h]: p, [f]: m });
                            return {
                              ...y,
                              data: {
                                x: y.x - n,
                                y: y.y - r,
                                enabled: { [h]: o, [f]: s },
                              },
                            };
                          },
                        }
                      );
                    })(t);
                    return { name: n.name, fn: n.fn, options: [t, e] };
                  })({
                    mainAxis: !0,
                    crossAxis: !1,
                    limiter:
                      "partial" === H
                        ? ((t, e) => ({
                            fn: (function (t) {
                              return (
                                void 0 === t && (t = {}),
                                {
                                  options: t,
                                  fn(e) {
                                    let {
                                        x: n,
                                        y: r,
                                        placement: i,
                                        rects: a,
                                        middlewareData: o,
                                      } = e,
                                      {
                                        offset: s = 0,
                                        mainAxis: l = !0,
                                        crossAxis: u = !0,
                                      } = P(t, e),
                                      c = { x: n, y: r },
                                      d = N(i),
                                      f = D(d),
                                      h = c[f],
                                      p = c[d],
                                      m = P(s, e),
                                      y =
                                        "number" == typeof m
                                          ? { mainAxis: m, crossAxis: 0 }
                                          : { mainAxis: 0, crossAxis: 0, ...m };
                                    if (l) {
                                      let t = "y" === f ? "height" : "width",
                                        e =
                                          a.reference[f] -
                                          a.floating[t] +
                                          y.mainAxis,
                                        n =
                                          a.reference[f] +
                                          a.reference[t] -
                                          y.mainAxis;
                                      h < e ? (h = e) : h > n && (h = n);
                                    }
                                    if (u) {
                                      var g, v;
                                      let t = "y" === f ? "width" : "height",
                                        e = Y.has(A(i)),
                                        n =
                                          a.reference[d] -
                                          a.floating[t] +
                                          ((e &&
                                            (null == (g = o.offset)
                                              ? void 0
                                              : g[d])) ||
                                            0) +
                                          (e ? 0 : y.crossAxis),
                                        r =
                                          a.reference[d] +
                                          a.reference[t] +
                                          (e
                                            ? 0
                                            : (null == (v = o.offset)
                                                ? void 0
                                                : v[d]) || 0) -
                                          (e ? y.crossAxis : 0);
                                      p < n ? (p = n) : p > r && (p = r);
                                    }
                                    return { [f]: h, [d]: p };
                                  },
                                }
                              );
                            })(t).fn,
                            options: [t, e],
                          }))()
                        : void 0,
                    ...tu,
                  }),
                S &&
                  ((t, e) => {
                    let n = (function (t) {
                      return (
                        void 0 === t && (t = {}),
                        {
                          name: "flip",
                          options: t,
                          async fn(e) {
                            var n, r, i, a, o;
                            let {
                                placement: s,
                                middlewareData: l,
                                rects: u,
                                initialPlacement: c,
                                platform: d,
                                elements: f,
                              } = e,
                              {
                                mainAxis: h = !0,
                                crossAxis: p = !0,
                                fallbackPlacements: m,
                                fallbackStrategy: y = "bestFit",
                                fallbackAxisSideDirection: g = "none",
                                flipAlignment: v = !0,
                                ...b
                              } = P(t, e);
                            if (null != (n = l.arrow) && n.alignmentOffset)
                              return {};
                            let w = A(s),
                              x = N(c),
                              E = A(c) === c,
                              C = await (null == d.isRTL
                                ? void 0
                                : d.isRTL(f.floating)),
                              S =
                                m ||
                                (E || !v
                                  ? [B(c)]
                                  : (function (t) {
                                      let e = B(t);
                                      return [L(t), e, L(e)];
                                    })(c)),
                              T = "none" !== g;
                            !m &&
                              T &&
                              S.push(
                                ...(function (t, e, n, r) {
                                  let i = k(t),
                                    a = (function (t, e, n) {
                                      switch (t) {
                                        case "top":
                                        case "bottom":
                                          if (n) return e ? F : j;
                                          return e ? j : F;
                                        case "left":
                                        case "right":
                                          return e ? q : I;
                                        default:
                                          return [];
                                      }
                                    })(A(t), "start" === n, r);
                                  return (
                                    i &&
                                      ((a = a.map((t) => t + "-" + i)),
                                      e && (a = a.concat(a.map(L)))),
                                    a
                                  );
                                })(c, v, g, C),
                              );
                            let O = [c, ...S],
                              R = await d.detectOverflow(e, b),
                              H = [],
                              _ =
                                (null == (r = l.flip) ? void 0 : r.overflows) ||
                                [];
                            if ((h && H.push(R[w]), p)) {
                              let t = (function (t, e, n) {
                                void 0 === n && (n = !1);
                                let r = k(t),
                                  i = D(N(t)),
                                  a = M(i),
                                  o =
                                    "x" === i
                                      ? r === (n ? "end" : "start")
                                        ? "right"
                                        : "left"
                                      : "start" === r
                                        ? "bottom"
                                        : "top";
                                return (
                                  e.reference[a] > e.floating[a] && (o = B(o)),
                                  [o, B(o)]
                                );
                              })(s, u, C);
                              H.push(R[t[0]], R[t[1]]);
                            }
                            if (
                              ((_ = [..._, { placement: s, overflows: H }]),
                              !H.every((t) => t <= 0))
                            ) {
                              let t =
                                  ((null == (i = l.flip) ? void 0 : i.index) ||
                                    0) + 1,
                                e = O[t];
                              if (
                                e &&
                                ("alignment" !== p ||
                                  x === N(e) ||
                                  _.every(
                                    (t) =>
                                      N(t.placement) !== x ||
                                      t.overflows[0] > 0,
                                  ))
                              )
                                return {
                                  data: { index: t, overflows: _ },
                                  reset: { placement: e },
                                };
                              let n =
                                null ==
                                (a = _.filter((t) => t.overflows[0] <= 0).sort(
                                  (t, e) => t.overflows[1] - e.overflows[1],
                                )[0])
                                  ? void 0
                                  : a.placement;
                              if (!n)
                                switch (y) {
                                  case "bestFit": {
                                    let t =
                                      null ==
                                      (o = _.filter((t) => {
                                        if (T) {
                                          let e = N(t.placement);
                                          return e === x || "y" === e;
                                        }
                                        return !0;
                                      })
                                        .map((t) => [
                                          t.placement,
                                          t.overflows
                                            .filter((t) => t > 0)
                                            .reduce((t, e) => t + e, 0),
                                        ])
                                        .sort((t, e) => t[1] - e[1])[0])
                                        ? void 0
                                        : o[0];
                                    t && (n = t);
                                    break;
                                  }
                                  case "initialPlacement":
                                    n = c;
                                }
                              if (s !== n) return { reset: { placement: n } };
                            }
                            return {};
                          },
                        }
                      );
                    })(t);
                    return { name: n.name, fn: n.fn, options: [t, e] };
                  })({ ...tu }),
                ((t, e) => {
                  let n = (function (t) {
                    return (
                      void 0 === t && (t = {}),
                      {
                        name: "size",
                        options: t,
                        async fn(e) {
                          var n, r;
                          let i,
                            a,
                            {
                              placement: o,
                              rects: s,
                              platform: l,
                              elements: u,
                            } = e,
                            { apply: c = () => {}, ...d } = P(t, e),
                            f = await l.detectOverflow(e, d),
                            h = A(o),
                            p = k(o),
                            m = "y" === N(o),
                            { width: y, height: g } = s.floating;
                          "top" === h || "bottom" === h
                            ? ((i = h),
                              (a =
                                p ===
                                ((await (null == l.isRTL
                                  ? void 0
                                  : l.isRTL(u.floating)))
                                  ? "start"
                                  : "end")
                                  ? "left"
                                  : "right"))
                            : ((a = h), (i = "end" === p ? "top" : "bottom"));
                          let v = g - f.top - f.bottom,
                            b = y - f.left - f.right,
                            w = E(g - f[i], v),
                            x = E(y - f[a], b),
                            S = !e.middlewareData.shift,
                            T = w,
                            O = x;
                          if (
                            (null != (n = e.middlewareData.shift) &&
                              n.enabled.x &&
                              (O = b),
                            null != (r = e.middlewareData.shift) &&
                              r.enabled.y &&
                              (T = v),
                            S && !p)
                          ) {
                            let t = C(f.left, 0),
                              e = C(f.right, 0),
                              n = C(f.top, 0),
                              r = C(f.bottom, 0);
                            m
                              ? (O =
                                  y -
                                  2 *
                                    (0 !== t || 0 !== e
                                      ? t + e
                                      : C(f.left, f.right)))
                              : (T =
                                  g -
                                  2 *
                                    (0 !== n || 0 !== r
                                      ? n + r
                                      : C(f.top, f.bottom)));
                          }
                          await c({
                            ...e,
                            availableWidth: O,
                            availableHeight: T,
                          });
                          let R = await l.getDimensions(u.floating);
                          return y !== R.width || g !== R.height
                            ? { reset: { rects: !0 } }
                            : {};
                        },
                      }
                    );
                  })(t);
                  return { name: n.name, fn: n.fn, options: [t, e] };
                })({
                  ...tu,
                  apply: (t) => {
                    let {
                        elements: e,
                        rects: n,
                        availableWidth: r,
                        availableHeight: i,
                      } = t,
                      { width: a, height: o } = n.reference,
                      s = e.floating.style;
                    (s.setProperty(
                      "--radix-popper-available-width",
                      "".concat(r, "px"),
                    ),
                      s.setProperty(
                        "--radix-popper-available-height",
                        "".concat(i, "px"),
                      ),
                      s.setProperty(
                        "--radix-popper-anchor-width",
                        "".concat(a, "px"),
                      ),
                      s.setProperty(
                        "--radix-popper-anchor-height",
                        "".concat(o, "px"),
                      ));
                  },
                }),
                te &&
                  ((t, e) => {
                    let n = ((t) => ({
                      name: "arrow",
                      options: t,
                      fn(e) {
                        let { element: n, padding: r } =
                          "function" == typeof t ? t(e) : t;
                        return n && {}.hasOwnProperty.call(n, "current")
                          ? null != n.current
                            ? tD({ element: n.current, padding: r }).fn(e)
                            : {}
                          : n
                            ? tD({ element: n, padding: r }).fn(e)
                            : {};
                      },
                    }))(t);
                    return { name: n.name, fn: n.fn, options: [t, e] };
                  })({ element: te, padding: x }),
                t2({ arrowWidth: ti, arrowHeight: ta }),
                _ &&
                  ((t, e) => {
                    let n = (function (t) {
                      return (
                        void 0 === t && (t = {}),
                        {
                          name: "hide",
                          options: t,
                          async fn(e) {
                            let { rects: n, platform: r } = e,
                              { strategy: i = "referenceHidden", ...a } = P(
                                t,
                                e,
                              );
                            switch (i) {
                              case "referenceHidden": {
                                let t = K(
                                  await r.detectOverflow(e, {
                                    ...a,
                                    elementContext: "reference",
                                  }),
                                  n.reference,
                                );
                                return {
                                  data: {
                                    referenceHiddenOffsets: t,
                                    referenceHidden: W(t),
                                  },
                                };
                              }
                              case "escaped": {
                                let t = K(
                                  await r.detectOverflow(e, {
                                    ...a,
                                    altBoundary: !0,
                                  }),
                                  n.floating,
                                );
                                return {
                                  data: { escapedOffsets: t, escaped: W(t) },
                                };
                              }
                              default:
                                return {};
                            }
                          },
                        }
                      );
                    })(t);
                    return { name: n.name, fn: n.fn, options: [t, e] };
                  })({ strategy: "referenceHidden", ...tu }),
              ],
            }),
            ty = G.setPlacementState;
          (0, v.N)(
            () => (
              ty(tf),
              () => {
                ty(void 0);
              }
            ),
            [tf, ty],
          );
          let [tv, tb] = t5(tf),
            tw = d(U);
          (0, v.N)(() => {
            th && (null == tw || tw());
          }, [th, tw]);
          let tE = null == (n = tm.arrow) ? void 0 : n.x,
            tC = null == (r = tm.arrow) ? void 0 : r.y,
            tS = (null == (i = tm.arrow) ? void 0 : i.centerOffset) !== 0,
            [tT, tO] = a.useState();
          return (
            (0, v.N)(() => {
              X && tO(window.getComputedStyle(X).zIndex);
            }, [X]),
            (0, f.jsx)("div", {
              ref: tc.setFloating,
              "data-radix-popper-content-wrapper": "",
              style: {
                ...td,
                transform: th ? td.transform : "translate(0, -200%)",
                minWidth: "max-content",
                zIndex: tT,
                "--radix-popper-transform-origin": [
                  null == (o = tm.transformOrigin) ? void 0 : o.x,
                  null == (s = tm.transformOrigin) ? void 0 : s.y,
                ].join(" "),
                ...((null == (u = tm.hide) ? void 0 : u.referenceHidden) && {
                  visibility: "hidden",
                  pointerEvents: "none",
                }),
              },
              dir: t.dir,
              children: (0, f.jsx)(tV, {
                scope: m,
                placedSide: tv,
                placedAlign: tb,
                onArrowChange: tn,
                arrowX: tE,
                arrowY: tC,
                shouldHideArrow: tS,
                children: (0, f.jsx)(c.sG.div, {
                  "data-side": tv,
                  "data-align": tb,
                  ...V,
                  ref: tt,
                  style: { ...V.style, animation: th ? void 0 : "none" },
                }),
              }),
            })
          );
        });
      tX.displayName = t$;
      var tZ = "PopperArrow",
        tJ = { top: "bottom", right: "left", bottom: "top", left: "right" },
        t0 = a.forwardRef(function (t, e) {
          let { __scopePopper: n, ...r } = t,
            i = tG(tZ, n),
            a = tJ[i.placedSide];
          return (0, f.jsx)("span", {
            ref: i.onArrowChange,
            style: {
              position: "absolute",
              left: i.arrowX,
              top: i.arrowY,
              [a]: 0,
              transformOrigin: {
                top: "",
                right: "0 0",
                bottom: "center 0",
                left: "100% 0",
              }[i.placedSide],
              transform: {
                top: "translateY(100%)",
                right: "translateY(50%) rotate(90deg) translateX(-50%)",
                bottom: "rotate(180deg)",
                left: "translateY(50%) rotate(-90deg) translateX(50%)",
              }[i.placedSide],
              visibility: i.shouldHideArrow ? "hidden" : void 0,
            },
            children: (0, f.jsx)(tI, {
              ...r,
              ref: e,
              style: { ...r.style, display: "block" },
            }),
          });
        });
      function t1(t) {
        return null !== t;
      }
      t0.displayName = tZ;
      var t2 = (t) => ({
        name: "transformOrigin",
        options: t,
        fn(e) {
          var n, r, i, a, o;
          let { placement: s, rects: l, middlewareData: u } = e,
            c = (null == (n = u.arrow) ? void 0 : n.centerOffset) !== 0,
            d = c ? 0 : t.arrowWidth,
            f = c ? 0 : t.arrowHeight,
            [h, p] = t5(s),
            m = { start: "0%", center: "50%", end: "100%" }[p],
            y =
              (null != (a = null == (r = u.arrow) ? void 0 : r.x) ? a : 0) +
              d / 2,
            g =
              (null != (o = null == (i = u.arrow) ? void 0 : i.y) ? o : 0) +
              f / 2,
            v = "",
            b = "";
          return (
            "bottom" === h
              ? ((v = c ? m : "".concat(y, "px")), (b = "".concat(-f, "px")))
              : "top" === h
                ? ((v = c ? m : "".concat(y, "px")),
                  (b = "".concat(l.floating.height + f, "px")))
                : "right" === h
                  ? ((v = "".concat(-f, "px")),
                    (b = c ? m : "".concat(g, "px")))
                  : "left" === h &&
                    ((v = "".concat(l.floating.width + f, "px")),
                    (b = c ? m : "".concat(g, "px"))),
            { data: { x: v, y: b } }
          );
        },
      });
      function t5(t) {
        let [e, n = "center"] = t.split("-");
        return [e, n];
      }
      var t4 = a.forwardRef((t, e) => {
        var n, r;
        let { container: i, ...o } = t,
          [s, l] = a.useState(!1);
        (0, v.N)(() => l(!0), []);
        let u =
          i ||
          (s &&
            (null == (r = globalThis) || null == (n = r.document)
              ? void 0
              : n.body));
        return u
          ? tM.createPortal((0, f.jsx)(c.sG.div, { ...o, ref: e }), u)
          : null;
      });
      t4.displayName = "Portal";
      var t7 = (t) => {
        let { present: e, children: n } = t,
          r = (function (t) {
            var e, n;
            let [r, i] = a.useState(),
              o = a.useRef(null),
              s = a.useRef(t),
              l = a.useRef("none"),
              [u, c] =
                ((e = t ? "mounted" : "unmounted"),
                (n = {
                  mounted: {
                    UNMOUNT: "unmounted",
                    ANIMATION_OUT: "unmountSuspended",
                  },
                  unmountSuspended: {
                    MOUNT: "mounted",
                    ANIMATION_END: "unmounted",
                  },
                  unmounted: { MOUNT: "mounted" },
                }),
                a.useReducer((t, e) => {
                  let r = n[t][e];
                  return null != r ? r : t;
                }, e));
            return (
              a.useEffect(() => {
                let t = t3(o.current);
                l.current = "mounted" === u ? t : "none";
              }, [u]),
              (0, v.N)(() => {
                let e = o.current,
                  n = s.current;
                if (n !== t) {
                  let r = l.current,
                    i = t3(e);
                  (t
                    ? c("MOUNT")
                    : "none" === i ||
                        (null == e ? void 0 : e.display) === "none"
                      ? c("UNMOUNT")
                      : n && r !== i
                        ? c("ANIMATION_OUT")
                        : c("UNMOUNT"),
                    (s.current = t));
                }
              }, [t, c]),
              (0, v.N)(() => {
                if (r) {
                  var t;
                  let e,
                    n = null != (t = r.ownerDocument.defaultView) ? t : window,
                    i = (t) => {
                      let i = t3(o.current).includes(
                        CSS.escape(t.animationName),
                      );
                      if (
                        t.target === r &&
                        i &&
                        (c("ANIMATION_END"), !s.current)
                      ) {
                        let t = r.style.animationFillMode;
                        ((r.style.animationFillMode = "forwards"),
                          (e = n.setTimeout(() => {
                            "forwards" === r.style.animationFillMode &&
                              (r.style.animationFillMode = t);
                          })));
                      }
                    },
                    a = (t) => {
                      t.target === r && (l.current = t3(o.current));
                    };
                  return (
                    r.addEventListener("animationstart", a),
                    r.addEventListener("animationcancel", i),
                    r.addEventListener("animationend", i),
                    () => {
                      (n.clearTimeout(e),
                        r.removeEventListener("animationstart", a),
                        r.removeEventListener("animationcancel", i),
                        r.removeEventListener("animationend", i));
                    }
                  );
                }
                c("ANIMATION_END");
              }, [r, c]),
              {
                isPresent: ["mounted", "unmountSuspended"].includes(u),
                ref: a.useCallback((t) => {
                  ((o.current = t ? getComputedStyle(t) : null), i(t));
                }, []),
              }
            );
          })(e),
          i =
            "function" == typeof n
              ? n({ present: r.isPresent })
              : a.Children.only(n),
          o = (function () {
            for (var t = arguments.length, e = Array(t), n = 0; n < t; n++)
              e[n] = arguments[n];
            let r = a.useRef(e);
            return (
              (r.current = e),
              a.useCallback((t) => {
                let e = r.current,
                  n = !1,
                  i = e.map((e) => {
                    let r = t8(e, t);
                    return (n || "function" != typeof r || (n = !0), r);
                  });
                if (n)
                  return () => {
                    for (let t = 0; t < i.length; t++) {
                      let n = i[t];
                      "function" == typeof n ? n() : t8(e[t], null);
                    }
                  };
              }, [])
            );
          })(
            r.ref,
            (function (t) {
              var e, n;
              let r =
                  null == (e = Object.getOwnPropertyDescriptor(t.props, "ref"))
                    ? void 0
                    : e.get,
                i = r && "isReactWarning" in r && r.isReactWarning;
              return i
                ? t.ref
                : (i =
                      (r =
                        null == (n = Object.getOwnPropertyDescriptor(t, "ref"))
                          ? void 0
                          : n.get) &&
                      "isReactWarning" in r &&
                      r.isReactWarning)
                  ? t.props.ref
                  : t.props.ref || t.ref;
            })(i),
          );
        return "function" == typeof n || r.isPresent
          ? a.cloneElement(i, { ref: o })
          : null;
      };
      function t8(t, e) {
        if ("function" == typeof t) return t(e);
        null != t && (t.current = e);
      }
      function t3(t) {
        return (null == t ? void 0 : t.animationName) || "none";
      }
      t7.displayName = "Presence";
      var t6 = n(6118),
        t9 = n(4111),
        et = Object.freeze({
          position: "absolute",
          border: 0,
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          wordWrap: "normal",
        }),
        ee = a.forwardRef((t, e) =>
          (0, f.jsx)(c.sG.span, { ...t, ref: e, style: { ...et, ...t.style } }),
        );
      ee.displayName = "VisuallyHidden";
      var [en, er] = (0, u.A)("Tooltip", [tz]),
        ei = tz(),
        ea = "TooltipProvider",
        eo = "tooltip.open",
        [es, el] = en(ea),
        eu = (t) => {
          let {
              __scopeTooltip: e,
              delayDuration: n = 700,
              skipDelayDuration: r = 300,
              disableHoverableContent: i = !1,
              children: o,
            } = t,
            s = a.useRef(!0),
            l = a.useRef(!1),
            u = a.useRef(0);
          return (
            a.useEffect(() => {
              let t = u.current;
              return () => window.clearTimeout(t);
            }, []),
            (0, f.jsx)(es, {
              scope: e,
              isOpenDelayedRef: s,
              delayDuration: n,
              onOpen: a.useCallback(() => {
                r <= 0 || (window.clearTimeout(u.current), (s.current = !1));
              }, [r]),
              onClose: a.useCallback(() => {
                r <= 0 ||
                  (window.clearTimeout(u.current),
                  (u.current = window.setTimeout(() => (s.current = !0), r)));
              }, [r]),
              isPointerInTransitRef: l,
              onPointerInTransitChange: a.useCallback((t) => {
                l.current = t;
              }, []),
              disableHoverableContent: i,
              children: o,
            })
          );
        };
      eu.displayName = ea;
      var ec = "Tooltip",
        [ed, ef] = en(ec),
        eh = (t) => {
          let {
              __scopeTooltip: e,
              children: n,
              open: r,
              defaultOpen: i,
              onOpenChange: o,
              disableHoverableContent: s,
              delayDuration: l,
            } = t,
            u = el(ec, t.__scopeTooltip),
            c = ei(e),
            [d, h] = a.useState(null),
            p = (function (t) {
              let [e, n] = a.useState(b());
              return (
                (0, v.N)(() => {
                  n((t) => t ?? String(w++));
                }, [void 0]),
                t || (e ? `radix-${e}` : "")
              );
            })(),
            m = a.useRef(0),
            y = null != s ? s : u.disableHoverableContent,
            g = null != l ? l : u.delayDuration,
            x = a.useRef(!1),
            [E, C] = (0, t9.i)({
              prop: r,
              defaultProp: null != i && i,
              onChange: (t) => {
                (t
                  ? (u.onOpen(), document.dispatchEvent(new CustomEvent(eo)))
                  : u.onClose(),
                  null == o || o(t));
              },
              caller: ec,
            }),
            S = a.useMemo(
              () =>
                E ? (x.current ? "delayed-open" : "instant-open") : "closed",
              [E],
            ),
            T = a.useCallback(() => {
              (window.clearTimeout(m.current),
                (m.current = 0),
                (x.current = !1),
                C(!0));
            }, [C]),
            O = a.useCallback(() => {
              (window.clearTimeout(m.current), (m.current = 0), C(!1));
            }, [C]),
            R = a.useCallback(() => {
              (window.clearTimeout(m.current),
                (m.current = window.setTimeout(() => {
                  ((x.current = !0), C(!0), (m.current = 0));
                }, g)));
            }, [g, C]);
          return (
            a.useEffect(
              () => () => {
                m.current && (window.clearTimeout(m.current), (m.current = 0));
              },
              [],
            ),
            (0, f.jsx)(tK, {
              ...c,
              children: (0, f.jsx)(ed, {
                scope: e,
                contentId: p,
                open: E,
                stateAttribute: S,
                trigger: d,
                onTriggerChange: h,
                onTriggerEnter: a.useCallback(() => {
                  u.isOpenDelayedRef.current ? R() : T();
                }, [u.isOpenDelayedRef, R, T]),
                onTriggerLeave: a.useCallback(() => {
                  y ? O() : (window.clearTimeout(m.current), (m.current = 0));
                }, [O, y]),
                onOpen: T,
                onClose: O,
                disableHoverableContent: y,
                children: n,
              }),
            })
          );
        };
      eh.displayName = ec;
      var ep = "TooltipTrigger",
        em = a.forwardRef((t, e) => {
          let { __scopeTooltip: n, ...r } = t,
            i = ef(ep, n),
            o = el(ep, n),
            u = ei(n),
            d = a.useRef(null),
            h = (0, l.s)(e, d, i.onTriggerChange),
            p = a.useRef(!1),
            m = a.useRef(!1),
            y = a.useCallback(() => (p.current = !1), []);
          return (
            a.useEffect(
              () => () => document.removeEventListener("pointerup", y),
              [y],
            ),
            (0, f.jsx)(tY, {
              asChild: !0,
              ...u,
              children: (0, f.jsx)(c.sG.button, {
                "aria-describedby": i.open ? i.contentId : void 0,
                "data-state": i.stateAttribute,
                ...r,
                ref: h,
                onPointerMove: (0, s.mK)(t.onPointerMove, (t) => {
                  "touch" !== t.pointerType &&
                    (m.current ||
                      o.isPointerInTransitRef.current ||
                      (i.onTriggerEnter(), (m.current = !0)));
                }),
                onPointerLeave: (0, s.mK)(t.onPointerLeave, () => {
                  (i.onTriggerLeave(), (m.current = !1));
                }),
                onPointerDown: (0, s.mK)(t.onPointerDown, () => {
                  (i.open && i.onClose(),
                    (p.current = !0),
                    document.addEventListener("pointerup", y, { once: !0 }));
                }),
                onFocus: (0, s.mK)(t.onFocus, () => {
                  p.current || i.onOpen();
                }),
                onBlur: (0, s.mK)(t.onBlur, i.onClose),
                onClick: (0, s.mK)(t.onClick, i.onClose),
              }),
            })
          );
        });
      em.displayName = ep;
      var ey = "TooltipPortal",
        [eg, ev] = en(ey, { forceMount: void 0 }),
        eb = (t) => {
          let {
              __scopeTooltip: e,
              forceMount: n,
              children: r,
              container: i,
            } = t,
            a = ef(ey, e);
          return (0, f.jsx)(eg, {
            scope: e,
            forceMount: n,
            children: (0, f.jsx)(t7, {
              present: n || a.open,
              children: (0, f.jsx)(t4, {
                asChild: !0,
                container: i,
                children: r,
              }),
            }),
          });
        };
      eb.displayName = ey;
      var ew = "TooltipContent",
        ex = a.forwardRef((t, e) => {
          let n = ev(ew, t.__scopeTooltip),
            { forceMount: r = n.forceMount, side: i = "top", ...a } = t,
            o = ef(ew, t.__scopeTooltip);
          return (0, f.jsx)(t7, {
            present: r || o.open,
            children: o.disableHoverableContent
              ? (0, f.jsx)(eO, { side: i, ...a, ref: e })
              : (0, f.jsx)(eE, { side: i, ...a, ref: e }),
          });
        }),
        eE = a.forwardRef((t, e) => {
          let n = ef(ew, t.__scopeTooltip),
            r = el(ew, t.__scopeTooltip),
            i = a.useRef(null),
            o = (0, l.s)(e, i),
            [s, u] = a.useState(null),
            { trigger: c, onClose: d } = n,
            h = i.current,
            { onPointerInTransitChange: p } = r,
            m = a.useCallback(() => {
              (u(null), p(!1));
            }, [p]),
            y = a.useCallback(
              (t, e) => {
                let n = t.currentTarget,
                  r = { x: t.clientX, y: t.clientY },
                  i = (function (t, e) {
                    let n = Math.abs(e.top - t.y),
                      r = Math.abs(e.bottom - t.y),
                      i = Math.abs(e.right - t.x),
                      a = Math.abs(e.left - t.x);
                    switch (Math.min(n, r, i, a)) {
                      case a:
                        return "left";
                      case i:
                        return "right";
                      case n:
                        return "top";
                      case r:
                        return "bottom";
                      default:
                        throw Error("unreachable");
                    }
                  })(r, n.getBoundingClientRect());
                (u(
                  (function (t) {
                    let e = t.slice();
                    return (
                      e.sort((t, e) =>
                        t.x < e.x
                          ? -1
                          : t.x > e.x
                            ? 1
                            : t.y < e.y
                              ? -1
                              : 1 * !!(t.y > e.y),
                      ),
                      (function (t) {
                        if (t.length <= 1) return t.slice();
                        let e = [];
                        for (let n = 0; n < t.length; n++) {
                          let r = t[n];
                          for (; e.length >= 2; ) {
                            let t = e[e.length - 1],
                              n = e[e.length - 2];
                            if (
                              (t.x - n.x) * (r.y - n.y) >=
                              (t.y - n.y) * (r.x - n.x)
                            )
                              e.pop();
                            else break;
                          }
                          e.push(r);
                        }
                        e.pop();
                        let n = [];
                        for (let e = t.length - 1; e >= 0; e--) {
                          let r = t[e];
                          for (; n.length >= 2; ) {
                            let t = n[n.length - 1],
                              e = n[n.length - 2];
                            if (
                              (t.x - e.x) * (r.y - e.y) >=
                              (t.y - e.y) * (r.x - e.x)
                            )
                              n.pop();
                            else break;
                          }
                          n.push(r);
                        }
                        return (n.pop(),
                        1 === e.length &&
                          1 === n.length &&
                          e[0].x === n[0].x &&
                          e[0].y === n[0].y)
                          ? e
                          : e.concat(n);
                      })(e)
                    );
                  })([
                    ...(function (t, e) {
                      let n =
                          arguments.length > 2 && void 0 !== arguments[2]
                            ? arguments[2]
                            : 5,
                        r = [];
                      switch (e) {
                        case "top":
                          r.push(
                            { x: t.x - n, y: t.y + n },
                            { x: t.x + n, y: t.y + n },
                          );
                          break;
                        case "bottom":
                          r.push(
                            { x: t.x - n, y: t.y - n },
                            { x: t.x + n, y: t.y - n },
                          );
                          break;
                        case "left":
                          r.push(
                            { x: t.x + n, y: t.y - n },
                            { x: t.x + n, y: t.y + n },
                          );
                          break;
                        case "right":
                          r.push(
                            { x: t.x - n, y: t.y - n },
                            { x: t.x - n, y: t.y + n },
                          );
                      }
                      return r;
                    })(r, i),
                    ...(function (t) {
                      let { top: e, right: n, bottom: r, left: i } = t;
                      return [
                        { x: i, y: e },
                        { x: n, y: e },
                        { x: n, y: r },
                        { x: i, y: r },
                      ];
                    })(e.getBoundingClientRect()),
                  ]),
                ),
                  p(!0));
              },
              [p],
            );
          return (
            a.useEffect(() => () => m(), [m]),
            a.useEffect(() => {
              if (c && h) {
                let t = (t) => y(t, h),
                  e = (t) => y(t, c);
                return (
                  c.addEventListener("pointerleave", t),
                  h.addEventListener("pointerleave", e),
                  () => {
                    (c.removeEventListener("pointerleave", t),
                      h.removeEventListener("pointerleave", e));
                  }
                );
              }
            }, [c, h, y, m]),
            a.useEffect(() => {
              if (s) {
                let t = (t) => {
                  let e = t.target,
                    n = { x: t.clientX, y: t.clientY },
                    r =
                      (null == c ? void 0 : c.contains(e)) ||
                      (null == h ? void 0 : h.contains(e)),
                    i = !(function (t, e) {
                      let { x: n, y: r } = t,
                        i = !1;
                      for (let t = 0, a = e.length - 1; t < e.length; a = t++) {
                        let o = e[t],
                          s = e[a],
                          l = o.x,
                          u = o.y,
                          c = s.x,
                          d = s.y;
                        u > r != d > r &&
                          n < ((c - l) * (r - u)) / (d - u) + l &&
                          (i = !i);
                      }
                      return i;
                    })(n, s);
                  r ? m() : i && (m(), d());
                };
                return (
                  document.addEventListener("pointermove", t),
                  () => document.removeEventListener("pointermove", t)
                );
              }
            }, [c, h, s, d, m]),
            (0, f.jsx)(eO, { ...t, ref: o })
          );
        }),
        [eC, eS] = en(ec, { isInside: !1 }),
        eT = (0, t6.Dc)("TooltipContent"),
        eO = a.forwardRef((t, e) => {
          let {
              __scopeTooltip: n,
              children: r,
              "aria-label": i,
              onEscapeKeyDown: o,
              onPointerDownOutside: s,
              ...l
            } = t,
            u = ef(ew, n),
            c = ei(n),
            { onClose: d } = u;
          return (
            a.useEffect(
              () => (
                document.addEventListener(eo, d),
                () => document.removeEventListener(eo, d)
              ),
              [d],
            ),
            a.useEffect(() => {
              if (u.trigger) {
                let t = (t) => {
                  t.target instanceof Node &&
                    t.target.contains(u.trigger) &&
                    d();
                };
                return (
                  window.addEventListener("scroll", t, { capture: !0 }),
                  () => window.removeEventListener("scroll", t, { capture: !0 })
                );
              }
            }, [u.trigger, d]),
            (0, f.jsx)(m, {
              asChild: !0,
              disableOutsidePointerEvents: !1,
              onEscapeKeyDown: o,
              onPointerDownOutside: s,
              onFocusOutside: (t) => t.preventDefault(),
              onDismiss: d,
              children: (0, f.jsxs)(tX, {
                "data-state": u.stateAttribute,
                ...c,
                ...l,
                ref: e,
                style: {
                  ...l.style,
                  "--radix-tooltip-content-transform-origin":
                    "var(--radix-popper-transform-origin)",
                  "--radix-tooltip-content-available-width":
                    "var(--radix-popper-available-width)",
                  "--radix-tooltip-content-available-height":
                    "var(--radix-popper-available-height)",
                  "--radix-tooltip-trigger-width":
                    "var(--radix-popper-anchor-width)",
                  "--radix-tooltip-trigger-height":
                    "var(--radix-popper-anchor-height)",
                },
                children: [
                  (0, f.jsx)(eT, { children: r }),
                  (0, f.jsx)(eC, {
                    scope: n,
                    isInside: !0,
                    children: (0, f.jsx)(ee, {
                      id: u.contentId,
                      role: "tooltip",
                      children: i || r,
                    }),
                  }),
                ],
              }),
            })
          );
        });
      ex.displayName = ew;
      var eR = "TooltipArrow";
      a.forwardRef((t, e) => {
        let { __scopeTooltip: n, ...r } = t,
          i = ei(n);
        return eS(eR, n).isInside
          ? null
          : (0, f.jsx)(t0, { ...i, ...r, ref: e });
      }).displayName = eR;
      var eP = eu,
        eA = eh,
        ek = em,
        eD = eb,
        eM = ex;
    },
    9885: (t, e, n) => {
      n.d(e, { l$: () => w });
      var r = n(7620),
        i = n(7509);
      let a = Array(12).fill(0),
        o = (t) => {
          let { visible: e, className: n } = t;
          return r.createElement(
            "div",
            {
              className: ["sonner-loading-wrapper", n]
                .filter(Boolean)
                .join(" "),
              "data-visible": e,
            },
            r.createElement(
              "div",
              { className: "sonner-spinner" },
              a.map((t, e) =>
                r.createElement("div", {
                  className: "sonner-loading-bar",
                  key: "spinner-bar-".concat(e),
                }),
              ),
            ),
          );
        },
        s = r.createElement(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 20 20",
            fill: "currentColor",
            height: "20",
            width: "20",
          },
          r.createElement("path", {
            fillRule: "evenodd",
            d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
            clipRule: "evenodd",
          }),
        ),
        l = r.createElement(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            fill: "currentColor",
            height: "20",
            width: "20",
          },
          r.createElement("path", {
            fillRule: "evenodd",
            d: "M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z",
            clipRule: "evenodd",
          }),
        ),
        u = r.createElement(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 20 20",
            fill: "currentColor",
            height: "20",
            width: "20",
          },
          r.createElement("path", {
            fillRule: "evenodd",
            d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z",
            clipRule: "evenodd",
          }),
        ),
        c = r.createElement(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 20 20",
            fill: "currentColor",
            height: "20",
            width: "20",
          },
          r.createElement("path", {
            fillRule: "evenodd",
            d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z",
            clipRule: "evenodd",
          }),
        ),
        d = r.createElement(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            width: "12",
            height: "12",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
          },
          r.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
          r.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" }),
        ),
        f = 1;
      class h {
        constructor() {
          ((this.subscribe = (t) => (
            this.subscribers.push(t),
            () => {
              let e = this.subscribers.indexOf(t);
              this.subscribers.splice(e, 1);
            }
          )),
            (this.publish = (t) => {
              this.subscribers.forEach((e) => e(t));
            }),
            (this.addToast = (t) => {
              (this.publish(t), (this.toasts = [...this.toasts, t]));
            }),
            (this.create = (t) => {
              var e;
              let { message: n, ...r } = t,
                i =
                  "number" == typeof (null == t ? void 0 : t.id) ||
                  (null == (e = t.id) ? void 0 : e.length) > 0
                    ? t.id
                    : f++,
                a = this.toasts.find((t) => t.id === i),
                o = void 0 === t.dismissible || t.dismissible;
              return (
                this.dismissedToasts.has(i) && this.dismissedToasts.delete(i),
                a
                  ? (this.toasts = this.toasts.map((e) =>
                      e.id === i
                        ? (this.publish({ ...e, ...t, id: i, title: n }),
                          { ...e, ...t, id: i, dismissible: o, title: n })
                        : e,
                    ))
                  : this.addToast({ title: n, ...r, dismissible: o, id: i }),
                i
              );
            }),
            (this.dismiss = (t) => (
              t
                ? (this.dismissedToasts.add(t),
                  requestAnimationFrame(() =>
                    this.subscribers.forEach((e) => e({ id: t, dismiss: !0 })),
                  ))
                : this.toasts.forEach((t) => {
                    this.subscribers.forEach((e) =>
                      e({ id: t.id, dismiss: !0 }),
                    );
                  }),
              t
            )),
            (this.message = (t, e) => this.create({ ...e, message: t })),
            (this.error = (t, e) =>
              this.create({ ...e, message: t, type: "error" })),
            (this.success = (t, e) =>
              this.create({ ...e, type: "success", message: t })),
            (this.info = (t, e) =>
              this.create({ ...e, type: "info", message: t })),
            (this.warning = (t, e) =>
              this.create({ ...e, type: "warning", message: t })),
            (this.loading = (t, e) =>
              this.create({ ...e, type: "loading", message: t })),
            (this.promise = (t, e) => {
              let n, i;
              if (!e) return;
              void 0 !== e.loading &&
                (i = this.create({
                  ...e,
                  promise: t,
                  type: "loading",
                  message: e.loading,
                  description:
                    "function" != typeof e.description ? e.description : void 0,
                }));
              let a = Promise.resolve(t instanceof Function ? t() : t),
                o = void 0 !== i,
                s = a
                  .then(async (t) => {
                    if (((n = ["resolve", t]), r.isValidElement(t)))
                      ((o = !1),
                        this.create({ id: i, type: "default", message: t }));
                    else if (m(t) && !t.ok) {
                      o = !1;
                      let n =
                          "function" == typeof e.error
                            ? await e.error(
                                "HTTP error! status: ".concat(t.status),
                              )
                            : e.error,
                        a =
                          "function" == typeof e.description
                            ? await e.description(
                                "HTTP error! status: ".concat(t.status),
                              )
                            : e.description,
                        s =
                          "object" != typeof n || r.isValidElement(n)
                            ? { message: n }
                            : n;
                      this.create({
                        id: i,
                        type: "error",
                        description: a,
                        ...s,
                      });
                    } else if (t instanceof Error) {
                      o = !1;
                      let n =
                          "function" == typeof e.error
                            ? await e.error(t)
                            : e.error,
                        a =
                          "function" == typeof e.description
                            ? await e.description(t)
                            : e.description,
                        s =
                          "object" != typeof n || r.isValidElement(n)
                            ? { message: n }
                            : n;
                      this.create({
                        id: i,
                        type: "error",
                        description: a,
                        ...s,
                      });
                    } else if (void 0 !== e.success) {
                      o = !1;
                      let n =
                          "function" == typeof e.success
                            ? await e.success(t)
                            : e.success,
                        a =
                          "function" == typeof e.description
                            ? await e.description(t)
                            : e.description,
                        s =
                          "object" != typeof n || r.isValidElement(n)
                            ? { message: n }
                            : n;
                      this.create({
                        id: i,
                        type: "success",
                        description: a,
                        ...s,
                      });
                    }
                  })
                  .catch(async (t) => {
                    if (((n = ["reject", t]), void 0 !== e.error)) {
                      o = !1;
                      let n =
                          "function" == typeof e.error
                            ? await e.error(t)
                            : e.error,
                        a =
                          "function" == typeof e.description
                            ? await e.description(t)
                            : e.description,
                        s =
                          "object" != typeof n || r.isValidElement(n)
                            ? { message: n }
                            : n;
                      this.create({
                        id: i,
                        type: "error",
                        description: a,
                        ...s,
                      });
                    }
                  })
                  .finally(() => {
                    (o && (this.dismiss(i), (i = void 0)),
                      null == e.finally || e.finally.call(e));
                  }),
                l = () =>
                  new Promise((t, e) =>
                    s
                      .then(() => ("reject" === n[0] ? e(n[1]) : t(n[1])))
                      .catch(e),
                  );
              return "string" != typeof i && "number" != typeof i
                ? { unwrap: l }
                : Object.assign(i, { unwrap: l });
            }),
            (this.custom = (t, e) => {
              let n = (null == e ? void 0 : e.id) || f++;
              return (this.create({ jsx: t(n), id: n, ...e }), n);
            }),
            (this.getActiveToasts = () =>
              this.toasts.filter((t) => !this.dismissedToasts.has(t.id))),
            (this.subscribers = []),
            (this.toasts = []),
            (this.dismissedToasts = new Set()));
        }
      }
      let p = new h(),
        m = (t) =>
          t &&
          "object" == typeof t &&
          "ok" in t &&
          "boolean" == typeof t.ok &&
          "status" in t &&
          "number" == typeof t.status;
      function y(t) {
        return void 0 !== t.label;
      }
      function g() {
        for (var t = arguments.length, e = Array(t), n = 0; n < t; n++)
          e[n] = arguments[n];
        return e.filter(Boolean).join(" ");
      }
      (Object.assign(
        (t, e) => {
          let n = (null == e ? void 0 : e.id) || f++;
          return (p.addToast({ title: t, ...e, id: n }), n);
        },
        {
          success: p.success,
          info: p.info,
          warning: p.warning,
          error: p.error,
          custom: p.custom,
          message: p.message,
          promise: p.promise,
          dismiss: p.dismiss,
          loading: p.loading,
        },
        { getHistory: () => p.toasts, getToasts: () => p.getActiveToasts() },
      ),
        (function (t) {
          if (!t || "undefined" == typeof document) return;
          let e = document.head || document.getElementsByTagName("head")[0],
            n = document.createElement("style");
          ((n.type = "text/css"),
            e.appendChild(n),
            n.styleSheet
              ? (n.styleSheet.cssText = t)
              : n.appendChild(document.createTextNode(t)));
        })(
          "[data-sonner-toaster][dir=ltr],html[dir=ltr]{--toast-icon-margin-start:-3px;--toast-icon-margin-end:4px;--toast-svg-margin-start:-1px;--toast-svg-margin-end:0px;--toast-button-margin-start:auto;--toast-button-margin-end:0;--toast-close-button-start:0;--toast-close-button-end:unset;--toast-close-button-transform:translate(-35%, -35%)}[data-sonner-toaster][dir=rtl],html[dir=rtl]{--toast-icon-margin-start:4px;--toast-icon-margin-end:-3px;--toast-svg-margin-start:0px;--toast-svg-margin-end:-1px;--toast-button-margin-start:0;--toast-button-margin-end:auto;--toast-close-button-start:unset;--toast-close-button-end:0;--toast-close-button-transform:translate(35%, -35%)}[data-sonner-toaster]{position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1:hsl(0, 0%, 99%);--gray2:hsl(0, 0%, 97.3%);--gray3:hsl(0, 0%, 95.1%);--gray4:hsl(0, 0%, 93%);--gray5:hsl(0, 0%, 90.9%);--gray6:hsl(0, 0%, 88.7%);--gray7:hsl(0, 0%, 85.8%);--gray8:hsl(0, 0%, 78%);--gray9:hsl(0, 0%, 56.1%);--gray10:hsl(0, 0%, 52.3%);--gray11:hsl(0, 0%, 43.5%);--gray12:hsl(0, 0%, 9%);--border-radius:8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:0;z-index:999999999;transition:transform .4s ease}@media (hover:none) and (pointer:coarse){[data-sonner-toaster][data-lifted=true]{transform:none}}[data-sonner-toaster][data-x-position=right]{right:var(--offset-right)}[data-sonner-toaster][data-x-position=left]{left:var(--offset-left)}[data-sonner-toaster][data-x-position=center]{left:50%;transform:translateX(-50%)}[data-sonner-toaster][data-y-position=top]{top:var(--offset-top)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--offset-bottom)}[data-sonner-toast]{--y:translateY(100%);--lift-amount:calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:0;overflow-wrap:anywhere}[data-sonner-toast][data-styled=true]{padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px rgba(0,0,0,.1);width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}[data-sonner-toast]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-y-position=top]{top:0;--y:translateY(-100%);--lift:1;--lift-amount:calc(1 * var(--gap))}[data-sonner-toast][data-y-position=bottom]{bottom:0;--y:translateY(100%);--lift:-1;--lift-amount:calc(var(--lift) * var(--gap))}[data-sonner-toast][data-styled=true] [data-description]{font-weight:400;line-height:1.4;color:#3f3f3f}[data-rich-colors=true][data-sonner-toast][data-styled=true] [data-description]{color:inherit}[data-sonner-toaster][data-sonner-theme=dark] [data-description]{color:#e8e8e8}[data-sonner-toast][data-styled=true] [data-title]{font-weight:500;line-height:1.5;color:inherit}[data-sonner-toast][data-styled=true] [data-icon]{display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}[data-sonner-toast][data-promise=true] [data-icon]>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}[data-sonner-toast][data-styled=true] [data-icon]>*{flex-shrink:0}[data-sonner-toast][data-styled=true] [data-icon] svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}[data-sonner-toast][data-styled=true] [data-content]{display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;font-weight:500;cursor:pointer;outline:0;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}[data-sonner-toast][data-styled=true] [data-button]:focus-visible{box-shadow:0 0 0 2px rgba(0,0,0,.4)}[data-sonner-toast][data-styled=true] [data-button]:first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}[data-sonner-toast][data-styled=true] [data-cancel]{color:var(--normal-text);background:rgba(0,0,0,.08)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-styled=true] [data-cancel]{background:rgba(255,255,255,.3)}[data-sonner-toast][data-styled=true] [data-close-button]{position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);background:var(--normal-bg);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast][data-styled=true] [data-close-button]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-styled=true] [data-disabled=true]{cursor:not-allowed}[data-sonner-toast][data-styled=true]:hover [data-close-button]:hover{background:var(--gray2);border-color:var(--gray5)}[data-sonner-toast][data-swiping=true]::before{content:'';position:absolute;left:-100%;right:-100%;height:100%;z-index:-1}[data-sonner-toast][data-y-position=top][data-swiping=true]::before{bottom:50%;transform:scaleY(3) translateY(50%)}[data-sonner-toast][data-y-position=bottom][data-swiping=true]::before{top:50%;transform:scaleY(3) translateY(-50%)}[data-sonner-toast][data-swiping=false][data-removed=true]::before{content:'';position:absolute;inset:0;transform:scaleY(2)}[data-sonner-toast][data-expanded=true]::after{content:'';position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}[data-sonner-toast][data-mounted=true]{--y:translateY(0);opacity:1}[data-sonner-toast][data-expanded=false][data-front=false]{--scale:var(--toasts-before) * 0.05 + 1;--y:translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}[data-sonner-toast]>*{transition:opacity .4s}[data-sonner-toast][data-x-position=right]{right:0}[data-sonner-toast][data-x-position=left]{left:0}[data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>*{opacity:0}[data-sonner-toast][data-visible=false]{opacity:0;pointer-events:none}[data-sonner-toast][data-mounted=true][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}[data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false]{--y:translateY(calc(var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false]{--y:translateY(40%);opacity:0;transition:transform .5s,opacity .2s}[data-sonner-toast][data-removed=true][data-front=false]::before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y,0)) translateX(var(--swipe-amount-x,0));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width:600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-sonner-theme=light]{--normal-bg:#fff;--normal-border:var(--gray4);--normal-text:var(--gray12);--success-bg:hsl(143, 85%, 96%);--success-border:hsl(145, 92%, 87%);--success-text:hsl(140, 100%, 27%);--info-bg:hsl(208, 100%, 97%);--info-border:hsl(221, 91%, 93%);--info-text:hsl(210, 92%, 45%);--warning-bg:hsl(49, 100%, 97%);--warning-border:hsl(49, 91%, 84%);--warning-text:hsl(31, 92%, 45%);--error-bg:hsl(359, 100%, 97%);--error-border:hsl(359, 100%, 94%);--error-text:hsl(360, 100%, 45%)}[data-sonner-toaster][data-sonner-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg:#000;--normal-border:hsl(0, 0%, 20%);--normal-text:var(--gray1)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg:#fff;--normal-border:var(--gray3);--normal-text:var(--gray12)}[data-sonner-toaster][data-sonner-theme=dark]{--normal-bg:#000;--normal-bg-hover:hsl(0, 0%, 12%);--normal-border:hsl(0, 0%, 20%);--normal-border-hover:hsl(0, 0%, 25%);--normal-text:var(--gray1);--success-bg:hsl(150, 100%, 6%);--success-border:hsl(147, 100%, 12%);--success-text:hsl(150, 86%, 65%);--info-bg:hsl(215, 100%, 6%);--info-border:hsl(223, 43%, 17%);--info-text:hsl(216, 87%, 65%);--warning-bg:hsl(64, 100%, 6%);--warning-border:hsl(60, 100%, 9%);--warning-text:hsl(46, 87%, 65%);--error-bg:hsl(358, 76%, 10%);--error-border:hsl(357, 89%, 16%);--error-text:hsl(358, 100%, 81%)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size:16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:first-child{animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}100%{opacity:.15}}@media (prefers-reduced-motion){.sonner-loading-bar,[data-sonner-toast],[data-sonner-toast]>*{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}",
        ));
      let v = (t) => {
        var e, n, i, a, f, h, p, m, v, b, w;
        let {
            invert: x,
            toast: E,
            unstyled: C,
            interacting: S,
            setHeights: T,
            visibleToasts: O,
            heights: R,
            index: P,
            toasts: A,
            expanded: k,
            removeToast: D,
            defaultRichColors: M,
            closeButton: N,
            style: L,
            cancelButtonStyle: j,
            actionButtonStyle: F,
            className: q = "",
            descriptionClassName: I = "",
            duration: B,
            position: H,
            gap: _,
            expandByDefault: z,
            classNames: U,
            icons: Q,
            closeButtonAriaLabel: K = "Close toast",
          } = t,
          [W, Y] = r.useState(null),
          [$, V] = r.useState(null),
          [G, X] = r.useState(!1),
          [Z, J] = r.useState(!1),
          [tt, te] = r.useState(!1),
          [tn, tr] = r.useState(!1),
          [ti, ta] = r.useState(!1),
          [to, ts] = r.useState(0),
          [tl, tu] = r.useState(0),
          tc = r.useRef(E.duration || B || 4e3),
          td = r.useRef(null),
          tf = r.useRef(null),
          th = 0 === P,
          tp = P + 1 <= O,
          tm = E.type,
          ty = !1 !== E.dismissible,
          tg = E.className || "",
          tv = E.descriptionClassName || "",
          tb = r.useMemo(
            () => R.findIndex((t) => t.toastId === E.id) || 0,
            [R, E.id],
          ),
          tw = r.useMemo(() => {
            var t;
            return null != (t = E.closeButton) ? t : N;
          }, [E.closeButton, N]),
          tx = r.useMemo(() => E.duration || B || 4e3, [E.duration, B]),
          tE = r.useRef(0),
          tC = r.useRef(0),
          tS = r.useRef(0),
          tT = r.useRef(null),
          [tO, tR] = H.split("-"),
          tP = r.useMemo(
            () => R.reduce((t, e, n) => (n >= tb ? t : t + e.height), 0),
            [R, tb],
          ),
          tA = (() => {
            let [t, e] = r.useState(document.hidden);
            return (
              r.useEffect(() => {
                let t = () => {
                  e(document.hidden);
                };
                return (
                  document.addEventListener("visibilitychange", t),
                  () => window.removeEventListener("visibilitychange", t)
                );
              }, []),
              t
            );
          })(),
          tk = E.invert || x,
          tD = "loading" === tm;
        ((tC.current = r.useMemo(() => tb * _ + tP, [tb, tP])),
          r.useEffect(() => {
            tc.current = tx;
          }, [tx]),
          r.useEffect(() => {
            X(!0);
          }, []),
          r.useEffect(() => {
            let t = tf.current;
            if (t) {
              let e = t.getBoundingClientRect().height;
              return (
                tu(e),
                T((t) => [
                  { toastId: E.id, height: e, position: E.position },
                  ...t,
                ]),
                () => T((t) => t.filter((t) => t.toastId !== E.id))
              );
            }
          }, [T, E.id]),
          r.useLayoutEffect(() => {
            if (!G) return;
            let t = tf.current,
              e = t.style.height;
            t.style.height = "auto";
            let n = t.getBoundingClientRect().height;
            ((t.style.height = e),
              tu(n),
              T((t) =>
                t.find((t) => t.toastId === E.id)
                  ? t.map((t) => (t.toastId === E.id ? { ...t, height: n } : t))
                  : [{ toastId: E.id, height: n, position: E.position }, ...t],
              ));
          }, [G, E.title, E.description, T, E.id, E.jsx, E.action, E.cancel]));
        let tM = r.useCallback(() => {
          (J(!0),
            ts(tC.current),
            T((t) => t.filter((t) => t.toastId !== E.id)),
            setTimeout(() => {
              D(E);
            }, 200));
        }, [E, D, T, tC]);
        (r.useEffect(() => {
          let t;
          if (
            (!E.promise || "loading" !== tm) &&
            E.duration !== 1 / 0 &&
            "loading" !== E.type
          )
            return (
              k || S || tA
                ? (() => {
                    if (tS.current < tE.current) {
                      let t = new Date().getTime() - tE.current;
                      tc.current = tc.current - t;
                    }
                    tS.current = new Date().getTime();
                  })()
                : tc.current !== 1 / 0 &&
                  ((tE.current = new Date().getTime()),
                  (t = setTimeout(() => {
                    (null == E.onAutoClose || E.onAutoClose.call(E, E), tM());
                  }, tc.current))),
              () => clearTimeout(t)
            );
        }, [k, S, E, tm, tA, tM]),
          r.useEffect(() => {
            E.delete && (tM(), null == E.onDismiss || E.onDismiss.call(E, E));
          }, [tM, E.delete]));
        let tN =
          E.icon ||
          (null == Q ? void 0 : Q[tm]) ||
          ((t) => {
            switch (t) {
              case "success":
                return s;
              case "info":
                return u;
              case "warning":
                return l;
              case "error":
                return c;
              default:
                return null;
            }
          })(tm);
        return r.createElement(
          "li",
          {
            tabIndex: 0,
            ref: tf,
            className: g(
              q,
              tg,
              null == U ? void 0 : U.toast,
              null == E || null == (e = E.classNames) ? void 0 : e.toast,
              null == U ? void 0 : U.default,
              null == U ? void 0 : U[tm],
              null == E || null == (n = E.classNames) ? void 0 : n[tm],
            ),
            "data-sonner-toast": "",
            "data-rich-colors": null != (b = E.richColors) ? b : M,
            "data-styled": !(E.jsx || E.unstyled || C),
            "data-mounted": G,
            "data-promise": !!E.promise,
            "data-swiped": ti,
            "data-removed": Z,
            "data-visible": tp,
            "data-y-position": tO,
            "data-x-position": tR,
            "data-index": P,
            "data-front": th,
            "data-swiping": tt,
            "data-dismissible": ty,
            "data-type": tm,
            "data-invert": tk,
            "data-swipe-out": tn,
            "data-swipe-direction": $,
            "data-expanded": !!(k || (z && G)),
            "data-testid": E.testId,
            style: {
              "--index": P,
              "--toasts-before": P,
              "--z-index": A.length - P,
              "--offset": "".concat(Z ? to : tC.current, "px"),
              "--initial-height": z ? "auto" : "".concat(tl, "px"),
              ...L,
              ...E.style,
            },
            onDragEnd: () => {
              (te(!1), Y(null), (tT.current = null));
            },
            onPointerDown: (t) => {
              2 !== t.button &&
                !tD &&
                ty &&
                ((td.current = new Date()),
                ts(tC.current),
                t.target.setPointerCapture(t.pointerId),
                "BUTTON" !== t.target.tagName &&
                  (te(!0), (tT.current = { x: t.clientX, y: t.clientY })));
            },
            onPointerUp: () => {
              var t, e, n, r, i;
              if (tn || !ty) return;
              tT.current = null;
              let a = Number(
                  (null == (t = tf.current)
                    ? void 0
                    : t.style
                        .getPropertyValue("--swipe-amount-x")
                        .replace("px", "")) || 0,
                ),
                o = Number(
                  (null == (e = tf.current)
                    ? void 0
                    : e.style
                        .getPropertyValue("--swipe-amount-y")
                        .replace("px", "")) || 0,
                ),
                s =
                  new Date().getTime() -
                  (null == (n = td.current) ? void 0 : n.getTime()),
                l = "x" === W ? a : o,
                u = Math.abs(l) / s;
              if (Math.abs(l) >= 45 || u > 0.11) {
                (ts(tC.current),
                  null == E.onDismiss || E.onDismiss.call(E, E),
                  "x" === W
                    ? V(a > 0 ? "right" : "left")
                    : V(o > 0 ? "down" : "up"),
                  tM(),
                  tr(!0));
                return;
              }
              (null == (r = tf.current) ||
                r.style.setProperty("--swipe-amount-x", "0px"),
                null == (i = tf.current) ||
                  i.style.setProperty("--swipe-amount-y", "0px"),
                ta(!1),
                te(!1),
                Y(null));
            },
            onPointerMove: (e) => {
              var n, r, i, a;
              if (
                !tT.current ||
                !ty ||
                (null == (n = window.getSelection())
                  ? void 0
                  : n.toString().length) > 0
              )
                return;
              let o = e.clientY - tT.current.y,
                s = e.clientX - tT.current.x,
                l =
                  null != (a = t.swipeDirections)
                    ? a
                    : (function (t) {
                        let [e, n] = t.split("-"),
                          r = [];
                        return (e && r.push(e), n && r.push(n), r);
                      })(H);
              !W &&
                (Math.abs(s) > 1 || Math.abs(o) > 1) &&
                Y(Math.abs(s) > Math.abs(o) ? "x" : "y");
              let u = { x: 0, y: 0 },
                c = (t) => 1 / (1.5 + Math.abs(t) / 20);
              if ("y" === W) {
                if (l.includes("top") || l.includes("bottom"))
                  if (
                    (l.includes("top") && o < 0) ||
                    (l.includes("bottom") && o > 0)
                  )
                    u.y = o;
                  else {
                    let t = o * c(o);
                    u.y = Math.abs(t) < Math.abs(o) ? t : o;
                  }
              } else if (
                "x" === W &&
                (l.includes("left") || l.includes("right"))
              )
                if (
                  (l.includes("left") && s < 0) ||
                  (l.includes("right") && s > 0)
                )
                  u.x = s;
                else {
                  let t = s * c(s);
                  u.x = Math.abs(t) < Math.abs(s) ? t : s;
                }
              ((Math.abs(u.x) > 0 || Math.abs(u.y) > 0) && ta(!0),
                null == (r = tf.current) ||
                  r.style.setProperty("--swipe-amount-x", "".concat(u.x, "px")),
                null == (i = tf.current) ||
                  i.style.setProperty(
                    "--swipe-amount-y",
                    "".concat(u.y, "px"),
                  ));
            },
          },
          tw && !E.jsx && "loading" !== tm
            ? r.createElement(
                "button",
                {
                  "aria-label": K,
                  "data-disabled": tD,
                  "data-close-button": !0,
                  onClick:
                    tD || !ty
                      ? () => {}
                      : () => {
                          (tM(), null == E.onDismiss || E.onDismiss.call(E, E));
                        },
                  className: g(
                    null == U ? void 0 : U.closeButton,
                    null == E || null == (i = E.classNames)
                      ? void 0
                      : i.closeButton,
                  ),
                },
                null != (w = null == Q ? void 0 : Q.close) ? w : d,
              )
            : null,
          (tm || E.icon || E.promise) &&
            null !== E.icon &&
            ((null == Q ? void 0 : Q[tm]) !== null || E.icon)
            ? r.createElement(
                "div",
                {
                  "data-icon": "",
                  className: g(
                    null == U ? void 0 : U.icon,
                    null == E || null == (a = E.classNames) ? void 0 : a.icon,
                  ),
                },
                E.promise || ("loading" === E.type && !E.icon)
                  ? E.icon ||
                      (function () {
                        var t, e;
                        return (null == Q ? void 0 : Q.loading)
                          ? r.createElement(
                              "div",
                              {
                                className: g(
                                  null == U ? void 0 : U.loader,
                                  null == E || null == (e = E.classNames)
                                    ? void 0
                                    : e.loader,
                                  "sonner-loader",
                                ),
                                "data-visible": "loading" === tm,
                              },
                              Q.loading,
                            )
                          : r.createElement(o, {
                              className: g(
                                null == U ? void 0 : U.loader,
                                null == E || null == (t = E.classNames)
                                  ? void 0
                                  : t.loader,
                              ),
                              visible: "loading" === tm,
                            });
                      })()
                  : null,
                "loading" !== E.type ? tN : null,
              )
            : null,
          r.createElement(
            "div",
            {
              "data-content": "",
              className: g(
                null == U ? void 0 : U.content,
                null == E || null == (f = E.classNames) ? void 0 : f.content,
              ),
            },
            r.createElement(
              "div",
              {
                "data-title": "",
                className: g(
                  null == U ? void 0 : U.title,
                  null == E || null == (h = E.classNames) ? void 0 : h.title,
                ),
              },
              E.jsx
                ? E.jsx
                : "function" == typeof E.title
                  ? E.title()
                  : E.title,
            ),
            E.description
              ? r.createElement(
                  "div",
                  {
                    "data-description": "",
                    className: g(
                      I,
                      tv,
                      null == U ? void 0 : U.description,
                      null == E || null == (p = E.classNames)
                        ? void 0
                        : p.description,
                    ),
                  },
                  "function" == typeof E.description
                    ? E.description()
                    : E.description,
                )
              : null,
          ),
          r.isValidElement(E.cancel)
            ? E.cancel
            : E.cancel && y(E.cancel)
              ? r.createElement(
                  "button",
                  {
                    "data-button": !0,
                    "data-cancel": !0,
                    style: E.cancelButtonStyle || j,
                    onClick: (t) => {
                      y(E.cancel) &&
                        ty &&
                        (null == E.cancel.onClick ||
                          E.cancel.onClick.call(E.cancel, t),
                        tM());
                    },
                    className: g(
                      null == U ? void 0 : U.cancelButton,
                      null == E || null == (m = E.classNames)
                        ? void 0
                        : m.cancelButton,
                    ),
                  },
                  E.cancel.label,
                )
              : null,
          r.isValidElement(E.action)
            ? E.action
            : E.action && y(E.action)
              ? r.createElement(
                  "button",
                  {
                    "data-button": !0,
                    "data-action": !0,
                    style: E.actionButtonStyle || F,
                    onClick: (t) => {
                      y(E.action) &&
                        (null == E.action.onClick ||
                          E.action.onClick.call(E.action, t),
                        t.defaultPrevented || tM());
                    },
                    className: g(
                      null == U ? void 0 : U.actionButton,
                      null == E || null == (v = E.classNames)
                        ? void 0
                        : v.actionButton,
                    ),
                  },
                  E.action.label,
                )
              : null,
        );
      };
      function b() {
        if ("undefined" == typeof window || "undefined" == typeof document)
          return "ltr";
        let t = document.documentElement.getAttribute("dir");
        return "auto" !== t && t
          ? t
          : window.getComputedStyle(document.documentElement).direction;
      }
      let w = r.forwardRef(function (t, e) {
        let {
            id: n,
            invert: a,
            position: o = "bottom-right",
            hotkey: s = ["altKey", "KeyT"],
            expand: l,
            closeButton: u,
            className: c,
            offset: d,
            mobileOffset: f,
            theme: h = "light",
            richColors: m,
            duration: y,
            style: g,
            visibleToasts: w = 3,
            toastOptions: x,
            dir: E = b(),
            gap: C = 14,
            icons: S,
            containerAriaLabel: T = "Notifications",
          } = t,
          [O, R] = r.useState([]),
          P = r.useMemo(
            () =>
              n
                ? O.filter((t) => t.toasterId === n)
                : O.filter((t) => !t.toasterId),
            [O, n],
          ),
          A = r.useMemo(
            () =>
              Array.from(
                new Set(
                  [o].concat(
                    P.filter((t) => t.position).map((t) => t.position),
                  ),
                ),
              ),
            [P, o],
          ),
          [k, D] = r.useState([]),
          [M, N] = r.useState(!1),
          [L, j] = r.useState(!1),
          [F, q] = r.useState(
            "system" !== h
              ? h
              : "undefined" != typeof window &&
                  window.matchMedia &&
                  window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light",
          ),
          I = r.useRef(null),
          B = s.join("+").replace(/Key/g, "").replace(/Digit/g, ""),
          H = r.useRef(null),
          _ = r.useRef(!1),
          z = r.useCallback((t) => {
            R((e) => {
              var n;
              return (
                (null == (n = e.find((e) => e.id === t.id))
                  ? void 0
                  : n.delete) || p.dismiss(t.id),
                e.filter((e) => {
                  let { id: n } = e;
                  return n !== t.id;
                })
              );
            });
          }, []);
        return (
          r.useEffect(
            () =>
              p.subscribe((t) => {
                if (t.dismiss)
                  return void requestAnimationFrame(() => {
                    R((e) =>
                      e.map((e) => (e.id === t.id ? { ...e, delete: !0 } : e)),
                    );
                  });
                setTimeout(() => {
                  i.flushSync(() => {
                    R((e) => {
                      let n = e.findIndex((e) => e.id === t.id);
                      return -1 !== n
                        ? [
                            ...e.slice(0, n),
                            { ...e[n], ...t },
                            ...e.slice(n + 1),
                          ]
                        : [t, ...e];
                    });
                  });
                });
              }),
            [O],
          ),
          r.useEffect(() => {
            if ("system" !== h) return void q(h);
            if (
              ("system" === h &&
                (window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
                  ? q("dark")
                  : q("light")),
              "undefined" == typeof window)
            )
              return;
            let t = window.matchMedia("(prefers-color-scheme: dark)");
            try {
              t.addEventListener("change", (t) => {
                let { matches: e } = t;
                e ? q("dark") : q("light");
              });
            } catch (e) {
              t.addListener((t) => {
                let { matches: e } = t;
                try {
                  e ? q("dark") : q("light");
                } catch (t) {
                  console.error(t);
                }
              });
            }
          }, [h]),
          r.useEffect(() => {
            O.length <= 1 && N(!1);
          }, [O]),
          r.useEffect(() => {
            let t = (t) => {
              var e, n;
              (s.every((e) => t[e] || t.code === e) &&
                (N(!0), null == (n = I.current) || n.focus()),
                "Escape" === t.code &&
                  (document.activeElement === I.current ||
                    (null == (e = I.current)
                      ? void 0
                      : e.contains(document.activeElement))) &&
                  N(!1));
            };
            return (
              document.addEventListener("keydown", t),
              () => document.removeEventListener("keydown", t)
            );
          }, [s]),
          r.useEffect(() => {
            if (I.current)
              return () => {
                H.current &&
                  (H.current.focus({ preventScroll: !0 }),
                  (H.current = null),
                  (_.current = !1));
              };
          }, [I.current]),
          r.createElement(
            "section",
            {
              ref: e,
              "aria-label": "".concat(T, " ").concat(B),
              tabIndex: -1,
              "aria-live": "polite",
              "aria-relevant": "additions text",
              "aria-atomic": "false",
              suppressHydrationWarning: !0,
            },
            A.map((e, n) => {
              var i;
              let [o, s] = e.split("-");
              return P.length
                ? r.createElement(
                    "ol",
                    {
                      key: e,
                      dir: "auto" === E ? b() : E,
                      tabIndex: -1,
                      ref: I,
                      className: c,
                      "data-sonner-toaster": !0,
                      "data-sonner-theme": F,
                      "data-y-position": o,
                      "data-x-position": s,
                      style: {
                        "--front-toast-height": "".concat(
                          (null == (i = k[0]) ? void 0 : i.height) || 0,
                          "px",
                        ),
                        "--width": "".concat(356, "px"),
                        "--gap": "".concat(C, "px"),
                        ...g,
                        ...(function (t, e) {
                          let n = {};
                          return (
                            [t, e].forEach((t, e) => {
                              let r = 1 === e,
                                i = r ? "--mobile-offset" : "--offset",
                                a = r ? "16px" : "24px";
                              function o(t) {
                                ["top", "right", "bottom", "left"].forEach(
                                  (e) => {
                                    n["".concat(i, "-").concat(e)] =
                                      "number" == typeof t
                                        ? "".concat(t, "px")
                                        : t;
                                  },
                                );
                              }
                              "number" == typeof t || "string" == typeof t
                                ? o(t)
                                : "object" == typeof t
                                  ? ["top", "right", "bottom", "left"].forEach(
                                      (e) => {
                                        void 0 === t[e]
                                          ? (n["".concat(i, "-").concat(e)] = a)
                                          : (n["".concat(i, "-").concat(e)] =
                                              "number" == typeof t[e]
                                                ? "".concat(t[e], "px")
                                                : t[e]);
                                      },
                                    )
                                  : o(a);
                            }),
                            n
                          );
                        })(d, f),
                      },
                      onBlur: (t) => {
                        _.current &&
                          !t.currentTarget.contains(t.relatedTarget) &&
                          ((_.current = !1),
                          H.current &&
                            (H.current.focus({ preventScroll: !0 }),
                            (H.current = null)));
                      },
                      onFocus: (t) => {
                        !(
                          t.target instanceof HTMLElement &&
                          "false" === t.target.dataset.dismissible
                        ) &&
                          (_.current ||
                            ((_.current = !0), (H.current = t.relatedTarget)));
                      },
                      onMouseEnter: () => N(!0),
                      onMouseMove: () => N(!0),
                      onMouseLeave: () => {
                        L || N(!1);
                      },
                      onDragEnd: () => N(!1),
                      onPointerDown: (t) => {
                        (t.target instanceof HTMLElement &&
                          "false" === t.target.dataset.dismissible) ||
                          j(!0);
                      },
                      onPointerUp: () => j(!1),
                    },
                    P.filter(
                      (t) => (!t.position && 0 === n) || t.position === e,
                    ).map((n, i) => {
                      var o, s;
                      return r.createElement(v, {
                        key: n.id,
                        icons: S,
                        index: i,
                        toast: n,
                        defaultRichColors: m,
                        duration:
                          null != (o = null == x ? void 0 : x.duration) ? o : y,
                        className: null == x ? void 0 : x.className,
                        descriptionClassName:
                          null == x ? void 0 : x.descriptionClassName,
                        invert: a,
                        visibleToasts: w,
                        closeButton:
                          null != (s = null == x ? void 0 : x.closeButton)
                            ? s
                            : u,
                        interacting: L,
                        position: e,
                        style: null == x ? void 0 : x.style,
                        unstyled: null == x ? void 0 : x.unstyled,
                        classNames: null == x ? void 0 : x.classNames,
                        cancelButtonStyle:
                          null == x ? void 0 : x.cancelButtonStyle,
                        actionButtonStyle:
                          null == x ? void 0 : x.actionButtonStyle,
                        closeButtonAriaLabel:
                          null == x ? void 0 : x.closeButtonAriaLabel,
                        removeToast: z,
                        toasts: P.filter((t) => t.position == n.position),
                        heights: k.filter((t) => t.position == n.position),
                        setHeights: D,
                        expandByDefault: l,
                        gap: C,
                        expanded: M,
                        swipeDirections: t.swipeDirections,
                      });
                    }),
                  )
                : null;
            }),
          )
        );
      });
    },
  },
]);
