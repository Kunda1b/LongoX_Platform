(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [250],
  {
    685: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => u }));
      var s = r(4568),
        n = r(8186),
        a = r(9977),
        l = r(5400),
        i = r(2046);
      let d = (0, i.A)("arrow-up-right", [
          ["path", { d: "M7 7h10v10", key: "1tivn9" }],
          ["path", { d: "M7 17 17 7", key: "1vkiza" }],
        ]),
        o = (0, i.A)("credit-card", [
          [
            "rect",
            {
              width: "20",
              height: "14",
              x: "2",
              y: "5",
              rx: "2",
              key: "ynyp8z",
            },
          ],
          ["line", { x1: "2", x2: "22", y1: "10", y2: "10", key: "1b3vmo" }],
        ]);
      var c = r(4289);
      function u() {
        return (0, s.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, s.jsxs)("div", {
              children: [
                (0, s.jsx)("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: "Billing",
                }),
                (0, s.jsx)("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Manage your subscription and invoices",
                }),
              ],
            }),
            (0, s.jsxs)("div", {
              className: "grid gap-4 md:grid-cols-3",
              children: [
                (0, s.jsxs)(n.Zp, {
                  children: [
                    (0, s.jsx)(n.aR, {
                      className: "pb-2",
                      children: (0, s.jsx)(n.ZB, {
                        className: "text-sm",
                        children: "Current Plan",
                      }),
                    }),
                    (0, s.jsxs)(n.Wu, {
                      children: [
                        (0, s.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "Pro",
                        }),
                        (0, s.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "$29/month \xb7 5,000 executions",
                        }),
                        (0, s.jsxs)(l.$, {
                          variant: "outline",
                          size: "sm",
                          className: "mt-3",
                          children: [
                            (0, s.jsx)(d, { className: "mr-1 h-4 w-4" }),
                            " Upgrade",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                (0, s.jsxs)(n.Zp, {
                  children: [
                    (0, s.jsx)(n.aR, {
                      className: "pb-2",
                      children: (0, s.jsx)(n.ZB, {
                        className: "text-sm",
                        children: "Usage",
                      }),
                    }),
                    (0, s.jsxs)(n.Wu, {
                      children: [
                        (0, s.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "2,341",
                        }),
                        (0, s.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "of 5,000 executions used",
                        }),
                        (0, s.jsx)("div", {
                          className: "mt-2 h-2 w-full rounded-full bg-muted",
                          children: (0, s.jsx)("div", {
                            className: "h-2 w-[47%] rounded-full bg-primary",
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                (0, s.jsxs)(n.Zp, {
                  children: [
                    (0, s.jsx)(n.aR, {
                      className: "pb-2",
                      children: (0, s.jsx)(n.ZB, {
                        className: "text-sm",
                        children: "Next Invoice",
                      }),
                    }),
                    (0, s.jsxs)(n.Wu, {
                      children: [
                        (0, s.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "$29.00",
                        }),
                        (0, s.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "Due Jul 1, 2026",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, s.jsxs)(n.Zp, {
              children: [
                (0, s.jsxs)(n.aR, {
                  className: "flex flex-row items-center justify-between",
                  children: [
                    (0, s.jsxs)("div", {
                      children: [
                        (0, s.jsx)(n.ZB, {
                          className: "text-lg",
                          children: "Invoices",
                        }),
                        (0, s.jsx)(n.BT, {
                          children: "Recent billing history",
                        }),
                      ],
                    }),
                    (0, s.jsxs)(l.$, {
                      variant: "outline",
                      size: "sm",
                      children: [
                        (0, s.jsx)(o, { className: "mr-1 h-4 w-4" }),
                        " Payment Methods",
                      ],
                    }),
                  ],
                }),
                (0, s.jsx)(n.Wu, {
                  children: (0, s.jsx)("div", {
                    className: "space-y-2",
                    children: [
                      { date: "Jun 1, 2026", amount: "$29.00", status: "paid" },
                      { date: "May 1, 2026", amount: "$29.00", status: "paid" },
                      { date: "Apr 1, 2026", amount: "$29.00", status: "paid" },
                    ].map((e) =>
                      (0, s.jsxs)(
                        "div",
                        {
                          className:
                            "flex items-center justify-between rounded-lg border p-3",
                          children: [
                            (0, s.jsxs)("div", {
                              children: [
                                (0, s.jsx)("span", {
                                  className: "text-sm font-medium",
                                  children: e.date,
                                }),
                                (0, s.jsx)("span", {
                                  className:
                                    "ml-4 text-sm text-muted-foreground",
                                  children: e.amount,
                                }),
                              ],
                            }),
                            (0, s.jsxs)("div", {
                              className: "flex items-center gap-2",
                              children: [
                                (0, s.jsx)(a.E, {
                                  variant: "success",
                                  children: e.status,
                                }),
                                (0, s.jsx)(l.$, {
                                  variant: "ghost",
                                  size: "icon",
                                  className: "h-8 w-8",
                                  children: (0, s.jsx)(c.A, {
                                    className: "h-4 w-4",
                                  }),
                                }),
                              ],
                            }),
                          ],
                        },
                        e.date,
                      ),
                    ),
                  }),
                }),
              ],
            }),
          ],
        });
      }
    },
    1715: (e, t, r) => {
      "use strict";
      r.d(t, { s: () => a });
      var s = r(7620);
      function n(e, t) {
        if ("function" == typeof e) return e(t);
        null != e && (e.current = t);
      }
      function a(...e) {
        return s.useCallback(
          (function (...e) {
            return (t) => {
              let r = !1,
                s = e.map((e) => {
                  let s = n(e, t);
                  return (r || "function" != typeof s || (r = !0), s);
                });
              if (r)
                return () => {
                  for (let t = 0; t < s.length; t++) {
                    let r = s[t];
                    "function" == typeof r ? r() : n(e[t], null);
                  }
                };
            };
          })(...e),
          e,
        );
      }
    },
    2046: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => d });
      var s = r(7620);
      let n = (e) => {
          let t = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, r) =>
            r ? r.toUpperCase() : t.toLowerCase(),
          );
          return t.charAt(0).toUpperCase() + t.slice(1);
        },
        a = function () {
          for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
            t[r] = arguments[r];
          return t
            .filter((e, t, r) => !!e && "" !== e.trim() && r.indexOf(e) === t)
            .join(" ")
            .trim();
        };
      var l = {
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
      let i = (0, s.forwardRef)((e, t) => {
          let {
            color: r = "currentColor",
            size: n = 24,
            strokeWidth: i = 2,
            absoluteStrokeWidth: d,
            className: o = "",
            children: c,
            iconNode: u,
            ...m
          } = e;
          return (0, s.createElement)(
            "svg",
            {
              ref: t,
              ...l,
              width: n,
              height: n,
              stroke: r,
              strokeWidth: d ? (24 * Number(i)) / Number(n) : i,
              className: a("lucide", o),
              ...(!c &&
                !((e) => {
                  for (let t in e)
                    if (t.startsWith("aria-") || "role" === t || "title" === t)
                      return !0;
                })(m) && { "aria-hidden": "true" }),
              ...m,
            },
            [
              ...u.map((e) => {
                let [t, r] = e;
                return (0, s.createElement)(t, r);
              }),
              ...(Array.isArray(c) ? c : [c]),
            ],
          );
        }),
        d = (e, t) => {
          let r = (0, s.forwardRef)((r, l) => {
            let { className: d, ...o } = r;
            return (0, s.createElement)(i, {
              ref: l,
              iconNode: t,
              className: a(
                "lucide-".concat(
                  n(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                d,
              ),
              ...o,
            });
          });
          return ((r.displayName = n(e)), r);
        };
    },
    4289: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => s });
      let s = (0, r(2046).A)("download", [
        ["path", { d: "M12 15V3", key: "m9g1x1" }],
        [
          "path",
          { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" },
        ],
        ["path", { d: "m7 10 5 5 5-5", key: "brsn70" }],
      ]);
    },
    4616: (e, t, r) => {
      "use strict";
      r.d(t, { F: () => l });
      var s = r(2902);
      let n = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        a = s.$,
        l = (e, t) => (r) => {
          var s;
          if ((null == t ? void 0 : t.variants) == null)
            return a(
              e,
              null == r ? void 0 : r.class,
              null == r ? void 0 : r.className,
            );
          let { variants: l, defaultVariants: i } = t,
            d = Object.keys(l).map((e) => {
              let t = null == r ? void 0 : r[e],
                s = null == i ? void 0 : i[e];
              if (null === t) return null;
              let a = n(t) || n(s);
              return l[e][a];
            }),
            o =
              r &&
              Object.entries(r).reduce((e, t) => {
                let [r, s] = t;
                return (void 0 === s || (e[r] = s), e);
              }, {});
          return a(
            e,
            d,
            null == t || null == (s = t.compoundVariants)
              ? void 0
              : s.reduce((e, t) => {
                  let { class: r, className: s, ...n } = t;
                  return Object.entries(n).every((e) => {
                    let [t, r] = e;
                    return Array.isArray(r)
                      ? r.includes({ ...i, ...o }[t])
                      : { ...i, ...o }[t] === r;
                  })
                    ? [...e, r, s]
                    : e;
                }, []),
            null == r ? void 0 : r.class,
            null == r ? void 0 : r.className,
          );
        };
    },
    5400: (e, t, r) => {
      "use strict";
      r.d(t, { $: () => o });
      var s = r(4568),
        n = r(7620),
        a = r(6118),
        l = r(4616),
        i = r(5703);
      let d = (0, l.F)(
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
        o = n.forwardRef((e, t) => {
          let { className: r, variant: n, size: l, asChild: o = !1, ...c } = e,
            u = o ? a.DX : "button";
          return (0, s.jsx)(u, {
            className: (0, i.cn)(d({ variant: n, size: l, className: r })),
            ref: t,
            ...c,
          });
        });
      o.displayName = "Button";
    },
    5703: (e, t, r) => {
      "use strict";
      r.d(t, { cn: () => a });
      var s = r(2902),
        n = r(3714);
      function a() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
          t[r] = arguments[r];
        return (0, n.QP)((0, s.$)(t));
      }
    },
    6118: (e, t, r) => {
      "use strict";
      r.d(t, { DX: () => i, Dc: () => o, TL: () => l });
      var s,
        n = r(7620),
        a = r(1715);
      function l(e) {
        let t = n.forwardRef((t, r) => {
          var s;
          let l,
            i,
            { children: o, ...u } = t,
            h = null,
            v = !1,
            g = [];
          (m(o) && "function" == typeof x && (o = x(o._payload)),
            n.Children.forEach(o, (e) => {
              var t;
              if (
                ((t = e),
                n.isValidElement(t) &&
                  "function" == typeof t.type &&
                  "__radixId" in t.type &&
                  t.type.__radixId === d)
              ) {
                v = !0;
                let t = "child" in e.props ? e.props.child : e.props.children;
                (m(t) && "function" == typeof x && (t = x(t._payload)),
                  (h = c(e, t)),
                  g.push(h?.props?.children));
              } else g.push(e);
            }),
            h
              ? (h = n.cloneElement(h, void 0, g))
              : !v &&
                1 === n.Children.count(o) &&
                n.isValidElement(o) &&
                (h = o));
          let y = h
              ? ((s = h),
                (i =
                  (l = Object.getOwnPropertyDescriptor(s.props, "ref")?.get) &&
                  "isReactWarning" in l &&
                  l.isReactWarning)
                  ? s.ref
                  : (i =
                        (l = Object.getOwnPropertyDescriptor(s, "ref")?.get) &&
                        "isReactWarning" in l &&
                        l.isReactWarning)
                    ? s.props.ref
                    : s.props.ref || s.ref)
              : void 0,
            b = (0, a.s)(r, y);
          if (!h) {
            if (o || 0 === o) throw Error(v ? p(e) : f(e));
            return o;
          }
          let j = (function (e, t) {
            let r = { ...t };
            for (let s in t) {
              let n = e[s],
                a = t[s];
              /^on[A-Z]/.test(s)
                ? n && a
                  ? (r[s] = (...e) => {
                      let t = a(...e);
                      return (n(...e), t);
                    })
                  : n && (r[s] = n)
                : "style" === s
                  ? (r[s] = { ...n, ...a })
                  : "className" === s &&
                    (r[s] = [n, a].filter(Boolean).join(" "));
            }
            return { ...e, ...r };
          })(u, h.props ?? {});
          return (
            h.type !== n.Fragment && (j.ref = r ? b : y),
            n.cloneElement(h, j)
          );
        });
        return ((t.displayName = `${e}.Slot`), t);
      }
      var i = l("Slot"),
        d = Symbol.for("radix.slottable");
      function o(e) {
        let t = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((t.displayName = `${e}.Slottable`), (t.__radixId = d), t);
      }
      var c = (e, t) => {
          if ("child" in e.props) {
            let t = e.props.child;
            return n.isValidElement(t)
              ? n.cloneElement(t, void 0, e.props.children(t.props.children))
              : null;
          }
          return n.isValidElement(t) ? t : null;
        },
        u = Symbol.for("react.lazy");
      function m(e) {
        var t;
        return (
          null != e &&
          "object" == typeof e &&
          "$$typeof" in e &&
          e.$$typeof === u &&
          "_payload" in e &&
          "object" == typeof (t = e._payload) &&
          null !== t &&
          "then" in t
        );
      }
      var f = (e) =>
          `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
        p = (e) =>
          `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
        x = (s || (s = r.t(n, 2)))[" use ".trim().toString()];
    },
    8186: (e, t, r) => {
      "use strict";
      r.d(t, {
        BT: () => o,
        Wu: () => c,
        ZB: () => d,
        Zp: () => l,
        aR: () => i,
      });
      var s = r(4568),
        n = r(7620),
        a = r(5703);
      let l = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, s.jsx)("div", {
          ref: t,
          className: (0, a.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            r,
          ),
          ...n,
        });
      });
      l.displayName = "Card";
      let i = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, s.jsx)("div", {
          ref: t,
          className: (0, a.cn)("flex flex-col space-y-1.5 p-6", r),
          ...n,
        });
      });
      i.displayName = "CardHeader";
      let d = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, s.jsx)("div", {
          ref: t,
          className: (0, a.cn)("font-semibold leading-none tracking-tight", r),
          ...n,
        });
      });
      d.displayName = "CardTitle";
      let o = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, s.jsx)("div", {
          ref: t,
          className: (0, a.cn)("text-sm text-muted-foreground", r),
          ...n,
        });
      });
      o.displayName = "CardDescription";
      let c = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, s.jsx)("div", {
          ref: t,
          className: (0, a.cn)("p-6 pt-0", r),
          ...n,
        });
      });
      ((c.displayName = "CardContent"),
        (n.forwardRef((e, t) => {
          let { className: r, ...n } = e;
          return (0, s.jsx)("div", {
            ref: t,
            className: (0, a.cn)("flex items-center p-6 pt-0", r),
            ...n,
          });
        }).displayName = "CardFooter"));
    },
    9050: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 685));
    },
    9977: (e, t, r) => {
      "use strict";
      r.d(t, { E: () => i });
      var s = r(4568);
      r(7620);
      var n = r(4616),
        a = r(5703);
      let l = (0, n.F)(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          variants: {
            variant: {
              default:
                "border-transparent bg-primary text-primary-foreground shadow",
              secondary:
                "border-transparent bg-secondary text-secondary-foreground",
              destructive:
                "border-transparent bg-destructive text-destructive-foreground shadow",
              outline: "text-foreground",
              success:
                "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
              warning:
                "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
              info: "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
            },
          },
          defaultVariants: { variant: "default" },
        },
      );
      function i(e) {
        let { className: t, variant: r, ...n } = e;
        return (0, s.jsx)("div", {
          className: (0, a.cn)(l({ variant: r }), t),
          ...n,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 9050))), (_N_E = e.O()));
  },
]);
