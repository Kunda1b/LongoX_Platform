(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [317],
  {
    1715: (e, t, r) => {
      "use strict";
      r.d(t, { s: () => s });
      var a = r(7620);
      function n(e, t) {
        if ("function" == typeof e) return e(t);
        null != e && (e.current = t);
      }
      function s(...e) {
        return a.useCallback(
          (function (...e) {
            return (t) => {
              let r = !1,
                a = e.map((e) => {
                  let a = n(e, t);
                  return (r || "function" != typeof a || (r = !0), a);
                });
              if (r)
                return () => {
                  for (let t = 0; t < a.length; t++) {
                    let r = a[t];
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
      r.d(t, { A: () => o });
      var a = r(7620);
      let n = (e) => {
          let t = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, r) =>
            r ? r.toUpperCase() : t.toLowerCase(),
          );
          return t.charAt(0).toUpperCase() + t.slice(1);
        },
        s = function () {
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
      let i = (0, a.forwardRef)((e, t) => {
          let {
            color: r = "currentColor",
            size: n = 24,
            strokeWidth: i = 2,
            absoluteStrokeWidth: o,
            className: d = "",
            children: c,
            iconNode: u,
            ...f
          } = e;
          return (0, a.createElement)(
            "svg",
            {
              ref: t,
              ...l,
              width: n,
              height: n,
              stroke: r,
              strokeWidth: o ? (24 * Number(i)) / Number(n) : i,
              className: s("lucide", d),
              ...(!c &&
                !((e) => {
                  for (let t in e)
                    if (t.startsWith("aria-") || "role" === t || "title" === t)
                      return !0;
                })(f) && { "aria-hidden": "true" }),
              ...f,
            },
            [
              ...u.map((e) => {
                let [t, r] = e;
                return (0, a.createElement)(t, r);
              }),
              ...(Array.isArray(c) ? c : [c]),
            ],
          );
        }),
        o = (e, t) => {
          let r = (0, a.forwardRef)((r, l) => {
            let { className: o, ...d } = r;
            return (0, a.createElement)(i, {
              ref: l,
              iconNode: t,
              className: s(
                "lucide-".concat(
                  n(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                o,
              ),
              ...d,
            });
          });
          return ((r.displayName = n(e)), r);
        };
    },
    2736: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => c }));
      var a = r(4568),
        n = r(8186),
        s = r(5400),
        l = r(8144);
      let i = (0, r(2046).A)("check-check", [
        ["path", { d: "M18 6 7 17l-5-5", key: "116fxf" }],
        ["path", { d: "m22 10-7.5 7.5L13 16", key: "ke71qq" }],
      ]);
      var o = r(6932);
      let d = [
        {
          title: "Workflow failed",
          message: "Order Processing failed at step 'Send notification'",
          time: "5 min ago",
          read: !1,
        },
        {
          title: "Credential expiring",
          message: "GitHub PAT will expire in 7 days",
          time: "1 hour ago",
          read: !1,
        },
        {
          title: "New version available",
          message: "LongoX v2.4.0 is ready to deploy",
          time: "1 day ago",
          read: !0,
        },
      ];
      function c() {
        return (0, a.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, a.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, a.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [
                    (0, a.jsx)(l.A, { className: "h-5 w-5" }),
                    (0, a.jsxs)("div", {
                      children: [
                        (0, a.jsx)("h1", {
                          className: "text-2xl font-bold tracking-tight",
                          children: "Notifications",
                        }),
                        (0, a.jsx)("p", {
                          className: "text-sm text-muted-foreground",
                          children: "System alerts and updates",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, a.jsxs)("div", {
                  className: "flex gap-2",
                  children: [
                    (0, a.jsxs)(s.$, {
                      variant: "ghost",
                      size: "sm",
                      children: [
                        (0, a.jsx)(i, { className: "mr-1 h-4 w-4" }),
                        " Mark all read",
                      ],
                    }),
                    (0, a.jsx)(s.$, {
                      variant: "outline",
                      size: "sm",
                      children: (0, a.jsx)(o.A, { className: "h-4 w-4" }),
                    }),
                  ],
                }),
              ],
            }),
            (0, a.jsx)("div", {
              className: "space-y-2",
              children: d.map((e, t) =>
                (0, a.jsx)(
                  n.Zp,
                  {
                    className: e.read ? "" : "border-primary/30",
                    children: (0, a.jsxs)(n.Wu, {
                      className: "flex items-start justify-between p-4",
                      children: [
                        (0, a.jsxs)("div", {
                          children: [
                            (0, a.jsxs)("div", {
                              className: "flex items-center gap-2",
                              children: [
                                (0, a.jsx)("p", {
                                  className: "text-sm font-medium",
                                  children: e.title,
                                }),
                                !e.read &&
                                  (0, a.jsx)("div", {
                                    className:
                                      "h-2 w-2 rounded-full bg-primary",
                                  }),
                              ],
                            }),
                            (0, a.jsx)("p", {
                              className: "text-xs text-muted-foreground mt-1",
                              children: e.message,
                            }),
                          ],
                        }),
                        (0, a.jsx)("span", {
                          className:
                            "text-xs text-muted-foreground whitespace-nowrap",
                          children: e.time,
                        }),
                      ],
                    }),
                  },
                  t,
                ),
              ),
            }),
          ],
        });
      }
    },
    4616: (e, t, r) => {
      "use strict";
      r.d(t, { F: () => l });
      var a = r(2902);
      let n = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        s = a.$,
        l = (e, t) => (r) => {
          var a;
          if ((null == t ? void 0 : t.variants) == null)
            return s(
              e,
              null == r ? void 0 : r.class,
              null == r ? void 0 : r.className,
            );
          let { variants: l, defaultVariants: i } = t,
            o = Object.keys(l).map((e) => {
              let t = null == r ? void 0 : r[e],
                a = null == i ? void 0 : i[e];
              if (null === t) return null;
              let s = n(t) || n(a);
              return l[e][s];
            }),
            d =
              r &&
              Object.entries(r).reduce((e, t) => {
                let [r, a] = t;
                return (void 0 === a || (e[r] = a), e);
              }, {});
          return s(
            e,
            o,
            null == t || null == (a = t.compoundVariants)
              ? void 0
              : a.reduce((e, t) => {
                  let { class: r, className: a, ...n } = t;
                  return Object.entries(n).every((e) => {
                    let [t, r] = e;
                    return Array.isArray(r)
                      ? r.includes({ ...i, ...d }[t])
                      : { ...i, ...d }[t] === r;
                  })
                    ? [...e, r, a]
                    : e;
                }, []),
            null == r ? void 0 : r.class,
            null == r ? void 0 : r.className,
          );
        };
    },
    5400: (e, t, r) => {
      "use strict";
      r.d(t, { $: () => d });
      var a = r(4568),
        n = r(7620),
        s = r(6118),
        l = r(4616),
        i = r(5703);
      let o = (0, l.F)(
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
        d = n.forwardRef((e, t) => {
          let { className: r, variant: n, size: l, asChild: d = !1, ...c } = e,
            u = d ? s.DX : "button";
          return (0, a.jsx)(u, {
            className: (0, i.cn)(o({ variant: n, size: l, className: r })),
            ref: t,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5703: (e, t, r) => {
      "use strict";
      r.d(t, { cn: () => s });
      var a = r(2902),
        n = r(3714);
      function s() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
          t[r] = arguments[r];
        return (0, n.QP)((0, a.$)(t));
      }
    },
    6118: (e, t, r) => {
      "use strict";
      r.d(t, { DX: () => i, Dc: () => d, TL: () => l });
      var a,
        n = r(7620),
        s = r(1715);
      function l(e) {
        let t = n.forwardRef((t, r) => {
          var a;
          let l,
            i,
            { children: d, ...u } = t,
            v = null,
            x = !1,
            g = [];
          (f(d) && "function" == typeof h && (d = h(d._payload)),
            n.Children.forEach(d, (e) => {
              var t;
              if (
                ((t = e),
                n.isValidElement(t) &&
                  "function" == typeof t.type &&
                  "__radixId" in t.type &&
                  t.type.__radixId === o)
              ) {
                x = !0;
                let t = "child" in e.props ? e.props.child : e.props.children;
                (f(t) && "function" == typeof h && (t = h(t._payload)),
                  (v = c(e, t)),
                  g.push(v?.props?.children));
              } else g.push(e);
            }),
            v
              ? (v = n.cloneElement(v, void 0, g))
              : !x &&
                1 === n.Children.count(d) &&
                n.isValidElement(d) &&
                (v = d));
          let y = v
              ? ((a = v),
                (i =
                  (l = Object.getOwnPropertyDescriptor(a.props, "ref")?.get) &&
                  "isReactWarning" in l &&
                  l.isReactWarning)
                  ? a.ref
                  : (i =
                        (l = Object.getOwnPropertyDescriptor(a, "ref")?.get) &&
                        "isReactWarning" in l &&
                        l.isReactWarning)
                    ? a.props.ref
                    : a.props.ref || a.ref)
              : void 0,
            b = (0, s.s)(r, y);
          if (!v) {
            if (d || 0 === d) throw Error(x ? m(e) : p(e));
            return d;
          }
          let N = (function (e, t) {
            let r = { ...t };
            for (let a in t) {
              let n = e[a],
                s = t[a];
              /^on[A-Z]/.test(a)
                ? n && s
                  ? (r[a] = (...e) => {
                      let t = s(...e);
                      return (n(...e), t);
                    })
                  : n && (r[a] = n)
                : "style" === a
                  ? (r[a] = { ...n, ...s })
                  : "className" === a &&
                    (r[a] = [n, s].filter(Boolean).join(" "));
            }
            return { ...e, ...r };
          })(u, v.props ?? {});
          return (
            v.type !== n.Fragment && (N.ref = r ? b : y),
            n.cloneElement(v, N)
          );
        });
        return ((t.displayName = `${e}.Slot`), t);
      }
      var i = l("Slot"),
        o = Symbol.for("radix.slottable");
      function d(e) {
        let t = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((t.displayName = `${e}.Slottable`), (t.__radixId = o), t);
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
      function f(e) {
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
      var p = (e) =>
          `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
        m = (e) =>
          `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
        h = (a || (a = r.t(n, 2)))[" use ".trim().toString()];
    },
    6932: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => a });
      let a = (0, r(2046).A)("settings", [
        [
          "path",
          {
            d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
            key: "1i5ecw",
          },
        ],
        ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
      ]);
    },
    8144: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => a });
      let a = (0, r(2046).A)("bell", [
        ["path", { d: "M10.268 21a2 2 0 0 0 3.464 0", key: "vwvbt9" }],
        [
          "path",
          {
            d: "M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
            key: "11g9vi",
          },
        ],
      ]);
    },
    8186: (e, t, r) => {
      "use strict";
      r.d(t, {
        BT: () => d,
        Wu: () => c,
        ZB: () => o,
        Zp: () => l,
        aR: () => i,
      });
      var a = r(4568),
        n = r(7620),
        s = r(5703);
      let l = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, a.jsx)("div", {
          ref: t,
          className: (0, s.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            r,
          ),
          ...n,
        });
      });
      l.displayName = "Card";
      let i = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, a.jsx)("div", {
          ref: t,
          className: (0, s.cn)("flex flex-col space-y-1.5 p-6", r),
          ...n,
        });
      });
      i.displayName = "CardHeader";
      let o = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, a.jsx)("div", {
          ref: t,
          className: (0, s.cn)("font-semibold leading-none tracking-tight", r),
          ...n,
        });
      });
      o.displayName = "CardTitle";
      let d = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, a.jsx)("div", {
          ref: t,
          className: (0, s.cn)("text-sm text-muted-foreground", r),
          ...n,
        });
      });
      d.displayName = "CardDescription";
      let c = n.forwardRef((e, t) => {
        let { className: r, ...n } = e;
        return (0, a.jsx)("div", {
          ref: t,
          className: (0, s.cn)("p-6 pt-0", r),
          ...n,
        });
      });
      ((c.displayName = "CardContent"),
        (n.forwardRef((e, t) => {
          let { className: r, ...n } = e;
          return (0, a.jsx)("div", {
            ref: t,
            className: (0, s.cn)("flex items-center p-6 pt-0", r),
            ...n,
          });
        }).displayName = "CardFooter"));
    },
    8983: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 2736));
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 8983))), (_N_E = e.O()));
  },
]);
