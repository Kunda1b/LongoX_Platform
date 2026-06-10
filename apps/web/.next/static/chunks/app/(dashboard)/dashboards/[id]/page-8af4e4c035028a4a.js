(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [180],
  {
    332: (e, r, t) => {
      Promise.resolve().then(t.bind(t, 3075));
    },
    1715: (e, r, t) => {
      "use strict";
      t.d(r, { s: () => n });
      var l = t(7620);
      function s(e, r) {
        if ("function" == typeof e) return e(r);
        null != e && (e.current = r);
      }
      function n(...e) {
        return l.useCallback(
          (function (...e) {
            return (r) => {
              let t = !1,
                l = e.map((e) => {
                  let l = s(e, r);
                  return (t || "function" != typeof l || (t = !0), l);
                });
              if (t)
                return () => {
                  for (let r = 0; r < l.length; r++) {
                    let t = l[r];
                    "function" == typeof t ? t() : s(e[r], null);
                  }
                };
            };
          })(...e),
          e,
        );
      }
    },
    2046: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => o });
      var l = t(7620);
      let s = (e) => {
          let r = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, r, t) =>
            t ? t.toUpperCase() : r.toLowerCase(),
          );
          return r.charAt(0).toUpperCase() + r.slice(1);
        },
        n = function () {
          for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
            r[t] = arguments[t];
          return r
            .filter((e, r, t) => !!e && "" !== e.trim() && t.indexOf(e) === r)
            .join(" ")
            .trim();
        };
      var i = {
        xmlns: "http://www.w3.org/2000/svg",
        width: 24,
        height: 24,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      };
      let a = (0, l.forwardRef)((e, r) => {
          let {
            color: t = "currentColor",
            size: s = 24,
            strokeWidth: a = 2,
            absoluteStrokeWidth: o,
            className: d = "",
            children: c,
            iconNode: u,
            ...f
          } = e;
          return (0, l.createElement)(
            "svg",
            {
              ref: r,
              ...i,
              width: s,
              height: s,
              stroke: t,
              strokeWidth: o ? (24 * Number(a)) / Number(s) : a,
              className: n("lucide", d),
              ...(!c &&
                !((e) => {
                  for (let r in e)
                    if (r.startsWith("aria-") || "role" === r || "title" === r)
                      return !0;
                })(f) && { "aria-hidden": "true" }),
              ...f,
            },
            [
              ...u.map((e) => {
                let [r, t] = e;
                return (0, l.createElement)(r, t);
              }),
              ...(Array.isArray(c) ? c : [c]),
            ],
          );
        }),
        o = (e, r) => {
          let t = (0, l.forwardRef)((t, i) => {
            let { className: o, ...d } = t;
            return (0, l.createElement)(a, {
              ref: i,
              iconNode: r,
              className: n(
                "lucide-".concat(
                  s(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                o,
              ),
              ...d,
            });
          });
          return ((t.displayName = s(e)), t);
        };
    },
    3075: (e, r, t) => {
      "use strict";
      (t.r(r), t.d(r, { default: () => o }));
      var l = t(4568),
        s = t(7620),
        n = t(8186),
        i = t(5400),
        a = t(7801);
      function o(e) {
        let { params: r } = e,
          { id: t } = (0, s.use)(r);
        return (0, l.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, l.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, l.jsxs)("div", {
                  children: [
                    (0, l.jsx)("h1", {
                      className: "text-2xl font-bold tracking-tight",
                      children: "Operations Overview",
                    }),
                    (0, l.jsxs)("p", {
                      className: "text-sm text-muted-foreground",
                      children: ["Dashboard ID: ", t],
                    }),
                  ],
                }),
                (0, l.jsxs)(i.$, {
                  size: "sm",
                  children: [
                    (0, l.jsx)(a.A, { className: "mr-1 h-4 w-4" }),
                    " Add Widget",
                  ],
                }),
              ],
            }),
            (0, l.jsxs)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
              children: [
                (0, l.jsxs)(n.Zp, {
                  children: [
                    (0, l.jsx)(n.aR, {
                      className: "pb-2",
                      children: (0, l.jsx)(n.ZB, {
                        className: "text-sm",
                        children: "Active Workflows",
                      }),
                    }),
                    (0, l.jsx)(n.Wu, {
                      children: (0, l.jsx)("div", {
                        className: "text-3xl font-bold",
                        children: "12",
                      }),
                    }),
                  ],
                }),
                (0, l.jsxs)(n.Zp, {
                  children: [
                    (0, l.jsx)(n.aR, {
                      className: "pb-2",
                      children: (0, l.jsx)(n.ZB, {
                        className: "text-sm",
                        children: "Failed Today",
                      }),
                    }),
                    (0, l.jsx)(n.Wu, {
                      children: (0, l.jsx)("div", {
                        className: "text-3xl font-bold text-destructive",
                        children: "3",
                      }),
                    }),
                  ],
                }),
                (0, l.jsxs)(n.Zp, {
                  children: [
                    (0, l.jsx)(n.aR, {
                      className: "pb-2",
                      children: (0, l.jsx)(n.ZB, {
                        className: "text-sm",
                        children: "Avg Response Time",
                      }),
                    }),
                    (0, l.jsx)(n.Wu, {
                      children: (0, l.jsx)("div", {
                        className: "text-3xl font-bold",
                        children: "1.2s",
                      }),
                    }),
                  ],
                }),
                (0, l.jsxs)(n.Zp, {
                  className: "col-span-full",
                  children: [
                    (0, l.jsx)(n.aR, {
                      children: (0, l.jsx)(n.ZB, {
                        className: "text-sm",
                        children: "Execution Timeline",
                      }),
                    }),
                    (0, l.jsx)(n.Wu, {
                      children: (0, l.jsx)("div", {
                        className: "flex h-32 items-end gap-2",
                        children: [30, 50, 80, 45, 70, 60, 90].map((e, r) =>
                          (0, l.jsxs)(
                            "div",
                            {
                              className:
                                "flex flex-1 flex-col items-center gap-1",
                              children: [
                                (0, l.jsx)("div", {
                                  className: "w-full rounded-md bg-primary/20",
                                  style: { height: "".concat(e, "px") },
                                }),
                                (0, l.jsx)("span", {
                                  className: "text-xs text-muted-foreground",
                                  children: [
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                    "Sun",
                                  ][r],
                                }),
                              ],
                            },
                            r,
                          ),
                        ),
                      }),
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      }
    },
    4616: (e, r, t) => {
      "use strict";
      t.d(r, { F: () => i });
      var l = t(2902);
      let s = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        n = l.$,
        i = (e, r) => (t) => {
          var l;
          if ((null == r ? void 0 : r.variants) == null)
            return n(
              e,
              null == t ? void 0 : t.class,
              null == t ? void 0 : t.className,
            );
          let { variants: i, defaultVariants: a } = r,
            o = Object.keys(i).map((e) => {
              let r = null == t ? void 0 : t[e],
                l = null == a ? void 0 : a[e];
              if (null === r) return null;
              let n = s(r) || s(l);
              return i[e][n];
            }),
            d =
              t &&
              Object.entries(t).reduce((e, r) => {
                let [t, l] = r;
                return (void 0 === l || (e[t] = l), e);
              }, {});
          return n(
            e,
            o,
            null == r || null == (l = r.compoundVariants)
              ? void 0
              : l.reduce((e, r) => {
                  let { class: t, className: l, ...s } = r;
                  return Object.entries(s).every((e) => {
                    let [r, t] = e;
                    return Array.isArray(t)
                      ? t.includes({ ...a, ...d }[r])
                      : { ...a, ...d }[r] === t;
                  })
                    ? [...e, t, l]
                    : e;
                }, []),
            null == t ? void 0 : t.class,
            null == t ? void 0 : t.className,
          );
        };
    },
    5400: (e, r, t) => {
      "use strict";
      t.d(r, { $: () => d });
      var l = t(4568),
        s = t(7620),
        n = t(6118),
        i = t(4616),
        a = t(5703);
      let o = (0, i.F)(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
          {
            variants: {
              variant: {
                default:
                  "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                destructive:
                  "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline:
                  "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary:
                  "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
              },
              size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9",
              },
            },
            defaultVariants: { variant: "default", size: "default" },
          },
        ),
        d = s.forwardRef((e, r) => {
          let { className: t, variant: s, size: i, asChild: d = !1, ...c } = e,
            u = d ? n.DX : "button";
          return (0, l.jsx)(u, {
            className: (0, a.cn)(o({ variant: s, size: i, className: t })),
            ref: r,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5703: (e, r, t) => {
      "use strict";
      t.d(r, { cn: () => n });
      var l = t(2902),
        s = t(3714);
      function n() {
        for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
          r[t] = arguments[t];
        return (0, s.QP)((0, l.$)(r));
      }
    },
    6118: (e, r, t) => {
      "use strict";
      t.d(r, { DX: () => a, Dc: () => d, TL: () => i });
      var l,
        s = t(7620),
        n = t(1715);
      function i(e) {
        let r = s.forwardRef((r, t) => {
          var l;
          let i,
            a,
            { children: d, ...u } = r,
            x = null,
            v = !1,
            g = [];
          (f(d) && "function" == typeof h && (d = h(d._payload)),
            s.Children.forEach(d, (e) => {
              var r;
              if (
                ((r = e),
                s.isValidElement(r) &&
                  "function" == typeof r.type &&
                  "__radixId" in r.type &&
                  r.type.__radixId === o)
              ) {
                v = !0;
                let r = "child" in e.props ? e.props.child : e.props.children;
                (f(r) && "function" == typeof h && (r = h(r._payload)),
                  (x = c(e, r)),
                  g.push(x?.props?.children));
              } else g.push(e);
            }),
            x
              ? (x = s.cloneElement(x, void 0, g))
              : !v &&
                1 === s.Children.count(d) &&
                s.isValidElement(d) &&
                (x = d));
          let y = x
              ? ((l = x),
                (a =
                  (i = Object.getOwnPropertyDescriptor(l.props, "ref")?.get) &&
                  "isReactWarning" in i &&
                  i.isReactWarning)
                  ? l.ref
                  : (a =
                        (i = Object.getOwnPropertyDescriptor(l, "ref")?.get) &&
                        "isReactWarning" in i &&
                        i.isReactWarning)
                    ? l.props.ref
                    : l.props.ref || l.ref)
              : void 0,
            b = (0, n.s)(t, y);
          if (!x) {
            if (d || 0 === d) throw Error(v ? m(e) : p(e));
            return d;
          }
          let j = (function (e, r) {
            let t = { ...r };
            for (let l in r) {
              let s = e[l],
                n = r[l];
              /^on[A-Z]/.test(l)
                ? s && n
                  ? (t[l] = (...e) => {
                      let r = n(...e);
                      return (s(...e), r);
                    })
                  : s && (t[l] = s)
                : "style" === l
                  ? (t[l] = { ...s, ...n })
                  : "className" === l &&
                    (t[l] = [s, n].filter(Boolean).join(" "));
            }
            return { ...e, ...t };
          })(u, x.props ?? {});
          return (
            x.type !== s.Fragment && (j.ref = t ? b : y),
            s.cloneElement(x, j)
          );
        });
        return ((r.displayName = `${e}.Slot`), r);
      }
      var a = i("Slot"),
        o = Symbol.for("radix.slottable");
      function d(e) {
        let r = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((r.displayName = `${e}.Slottable`), (r.__radixId = o), r);
      }
      var c = (e, r) => {
          if ("child" in e.props) {
            let r = e.props.child;
            return s.isValidElement(r)
              ? s.cloneElement(r, void 0, e.props.children(r.props.children))
              : null;
          }
          return s.isValidElement(r) ? r : null;
        },
        u = Symbol.for("react.lazy");
      function f(e) {
        var r;
        return (
          null != e &&
          "object" == typeof e &&
          "$$typeof" in e &&
          e.$$typeof === u &&
          "_payload" in e &&
          "object" == typeof (r = e._payload) &&
          null !== r &&
          "then" in r
        );
      }
      var p = (e) =>
          `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
        m = (e) =>
          `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
        h = (l || (l = t.t(s, 2)))[" use ".trim().toString()];
    },
    7801: (e, r, t) => {
      "use strict";
      t.d(r, { A: () => l });
      let l = (0, t(2046).A)("plus", [
        ["path", { d: "M5 12h14", key: "1ays0h" }],
        ["path", { d: "M12 5v14", key: "s699le" }],
      ]);
    },
    8186: (e, r, t) => {
      "use strict";
      t.d(r, {
        BT: () => d,
        Wu: () => c,
        ZB: () => o,
        Zp: () => i,
        aR: () => a,
      });
      var l = t(4568),
        s = t(7620),
        n = t(5703);
      let i = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, n.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            t,
          ),
          ...s,
        });
      });
      i.displayName = "Card";
      let a = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, n.cn)("flex flex-col space-y-1.5 p-6", t),
          ...s,
        });
      });
      a.displayName = "CardHeader";
      let o = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, n.cn)("font-semibold leading-none tracking-tight", t),
          ...s,
        });
      });
      o.displayName = "CardTitle";
      let d = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, n.cn)("text-sm text-muted-foreground", t),
          ...s,
        });
      });
      d.displayName = "CardDescription";
      let c = s.forwardRef((e, r) => {
        let { className: t, ...s } = e;
        return (0, l.jsx)("div", {
          ref: r,
          className: (0, n.cn)("p-6 pt-0", t),
          ...s,
        });
      });
      ((c.displayName = "CardContent"),
        (s.forwardRef((e, r) => {
          let { className: t, ...s } = e;
          return (0, l.jsx)("div", {
            ref: r,
            className: (0, n.cn)("flex items-center p-6 pt-0", t),
            ...s,
          });
        }).displayName = "CardFooter"));
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 332))), (_N_E = e.O()));
  },
]);
