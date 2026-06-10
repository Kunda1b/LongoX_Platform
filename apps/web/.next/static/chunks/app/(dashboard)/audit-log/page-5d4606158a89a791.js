(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [885],
  {
    1063: (e, t, r) => {
      "use strict";
      r.d(t, { p: () => i });
      var n = r(4568),
        s = r(7620),
        a = r(5703);
      let i = s.forwardRef((e, t) => {
        let { className: r, type: s, ...i } = e;
        return (0, n.jsx)("input", {
          type: s,
          className: (0, a.cn)(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            r,
          ),
          ref: t,
          ...i,
        });
      });
      i.displayName = "Input";
    },
    1411: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 2434));
    },
    1715: (e, t, r) => {
      "use strict";
      r.d(t, { s: () => a });
      var n = r(7620);
      function s(e, t) {
        if ("function" == typeof e) return e(t);
        null != e && (e.current = t);
      }
      function a(...e) {
        return n.useCallback(
          (function (...e) {
            return (t) => {
              let r = !1,
                n = e.map((e) => {
                  let n = s(e, t);
                  return (r || "function" != typeof n || (r = !0), n);
                });
              if (r)
                return () => {
                  for (let t = 0; t < n.length; t++) {
                    let r = n[t];
                    "function" == typeof r ? r() : s(e[t], null);
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
      var n = r(7620);
      let s = (e) => {
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
      let l = (0, n.forwardRef)((e, t) => {
          let {
            color: r = "currentColor",
            size: s = 24,
            strokeWidth: l = 2,
            absoluteStrokeWidth: o,
            className: d = "",
            children: c,
            iconNode: u,
            ...p
          } = e;
          return (0, n.createElement)(
            "svg",
            {
              ref: t,
              ...i,
              width: s,
              height: s,
              stroke: r,
              strokeWidth: o ? (24 * Number(l)) / Number(s) : l,
              className: a("lucide", d),
              ...(!c &&
                !((e) => {
                  for (let t in e)
                    if (t.startsWith("aria-") || "role" === t || "title" === t)
                      return !0;
                })(p) && { "aria-hidden": "true" }),
              ...p,
            },
            [
              ...u.map((e) => {
                let [t, r] = e;
                return (0, n.createElement)(t, r);
              }),
              ...(Array.isArray(c) ? c : [c]),
            ],
          );
        }),
        o = (e, t) => {
          let r = (0, n.forwardRef)((r, i) => {
            let { className: o, ...d } = r;
            return (0, n.createElement)(l, {
              ref: i,
              iconNode: t,
              className: a(
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
          return ((r.displayName = s(e)), r);
        };
    },
    2381: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("search", [
        ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
        ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
      ]);
    },
    2434: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => u }));
      var n = r(4568),
        s = r(1063),
        a = r(5400),
        i = r(7244),
        l = r(4289),
        o = r(2381),
        d = r(9977);
      let c = [
        {
          action: "workflow.created",
          user: "alice@acme.com",
          timestamp: "2 min ago",
          severity: "info",
        },
        {
          action: "credential.deleted",
          user: "bob@acme.com",
          timestamp: "15 min ago",
          severity: "warning",
        },
        {
          action: "user.invited",
          user: "admin@acme.com",
          timestamp: "1 hour ago",
          severity: "info",
        },
        {
          action: "workflow.execution_failed",
          user: "system",
          timestamp: "2 hours ago",
          severity: "error",
        },
      ];
      function u() {
        return (0, n.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, n.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, n.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [
                    (0, n.jsx)(i.A, { className: "h-5 w-5" }),
                    (0, n.jsxs)("div", {
                      children: [
                        (0, n.jsx)("h1", {
                          className: "text-2xl font-bold tracking-tight",
                          children: "Audit Log",
                        }),
                        (0, n.jsx)("p", {
                          className: "text-sm text-muted-foreground",
                          children: "Track all system events and changes",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, n.jsxs)(a.$, {
                  variant: "outline",
                  size: "sm",
                  children: [
                    (0, n.jsx)(l.A, { className: "mr-1 h-4 w-4" }),
                    " Export",
                  ],
                }),
              ],
            }),
            (0, n.jsxs)("div", {
              className: "relative w-full max-w-sm",
              children: [
                (0, n.jsx)(o.A, {
                  className:
                    "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                }),
                (0, n.jsx)(s.p, {
                  placeholder: "Search audit log...",
                  className: "pl-9",
                }),
              ],
            }),
            (0, n.jsxs)("div", {
              className: "rounded-lg border",
              children: [
                (0, n.jsxs)("div", {
                  className:
                    "grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground",
                  children: [
                    (0, n.jsx)("div", {
                      className: "col-span-4",
                      children: "Action",
                    }),
                    (0, n.jsx)("div", {
                      className: "col-span-3",
                      children: "User",
                    }),
                    (0, n.jsx)("div", {
                      className: "col-span-3",
                      children: "Timestamp",
                    }),
                    (0, n.jsx)("div", {
                      className: "col-span-2",
                      children: "Severity",
                    }),
                  ],
                }),
                c.map((e, t) =>
                  (0, n.jsxs)(
                    "div",
                    {
                      className:
                        "grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm last:border-0",
                      children: [
                        (0, n.jsx)("div", {
                          className: "col-span-4 font-mono text-xs",
                          children: e.action,
                        }),
                        (0, n.jsx)("div", {
                          className: "col-span-3 text-xs",
                          children: e.user,
                        }),
                        (0, n.jsx)("div", {
                          className: "col-span-3 text-muted-foreground text-xs",
                          children: e.timestamp,
                        }),
                        (0, n.jsx)("div", {
                          className: "col-span-2",
                          children: (0, n.jsx)(d.E, {
                            variant:
                              "error" === e.severity
                                ? "destructive"
                                : "warning" === e.severity
                                  ? "warning"
                                  : "info",
                            children: e.severity,
                          }),
                        }),
                      ],
                    },
                    t,
                  ),
                ),
              ],
            }),
          ],
        });
      }
    },
    4289: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("download", [
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
      r.d(t, { F: () => i });
      var n = r(2902);
      let s = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        a = n.$,
        i = (e, t) => (r) => {
          var n;
          if ((null == t ? void 0 : t.variants) == null)
            return a(
              e,
              null == r ? void 0 : r.class,
              null == r ? void 0 : r.className,
            );
          let { variants: i, defaultVariants: l } = t,
            o = Object.keys(i).map((e) => {
              let t = null == r ? void 0 : r[e],
                n = null == l ? void 0 : l[e];
              if (null === t) return null;
              let a = s(t) || s(n);
              return i[e][a];
            }),
            d =
              r &&
              Object.entries(r).reduce((e, t) => {
                let [r, n] = t;
                return (void 0 === n || (e[r] = n), e);
              }, {});
          return a(
            e,
            o,
            null == t || null == (n = t.compoundVariants)
              ? void 0
              : n.reduce((e, t) => {
                  let { class: r, className: n, ...s } = t;
                  return Object.entries(s).every((e) => {
                    let [t, r] = e;
                    return Array.isArray(r)
                      ? r.includes({ ...l, ...d }[t])
                      : { ...l, ...d }[t] === r;
                  })
                    ? [...e, r, n]
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
      var n = r(4568),
        s = r(7620),
        a = r(6118),
        i = r(4616),
        l = r(5703);
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
        d = s.forwardRef((e, t) => {
          let { className: r, variant: s, size: i, asChild: d = !1, ...c } = e,
            u = d ? a.DX : "button";
          return (0, n.jsx)(u, {
            className: (0, l.cn)(o({ variant: s, size: i, className: r })),
            ref: t,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5703: (e, t, r) => {
      "use strict";
      r.d(t, { cn: () => a });
      var n = r(2902),
        s = r(3714);
      function a() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
          t[r] = arguments[r];
        return (0, s.QP)((0, n.$)(t));
      }
    },
    6118: (e, t, r) => {
      "use strict";
      r.d(t, { DX: () => l, Dc: () => d, TL: () => i });
      var n,
        s = r(7620),
        a = r(1715);
      function i(e) {
        let t = s.forwardRef((t, r) => {
          var n;
          let i,
            l,
            { children: d, ...u } = t,
            v = null,
            g = !1,
            x = [];
          (p(d) && "function" == typeof h && (d = h(d._payload)),
            s.Children.forEach(d, (e) => {
              var t;
              if (
                ((t = e),
                s.isValidElement(t) &&
                  "function" == typeof t.type &&
                  "__radixId" in t.type &&
                  t.type.__radixId === o)
              ) {
                g = !0;
                let t = "child" in e.props ? e.props.child : e.props.children;
                (p(t) && "function" == typeof h && (t = h(t._payload)),
                  (v = c(e, t)),
                  x.push(v?.props?.children));
              } else x.push(e);
            }),
            v
              ? (v = s.cloneElement(v, void 0, x))
              : !g &&
                1 === s.Children.count(d) &&
                s.isValidElement(d) &&
                (v = d));
          let y = v
              ? ((n = v),
                (l =
                  (i = Object.getOwnPropertyDescriptor(n.props, "ref")?.get) &&
                  "isReactWarning" in i &&
                  i.isReactWarning)
                  ? n.ref
                  : (l =
                        (i = Object.getOwnPropertyDescriptor(n, "ref")?.get) &&
                        "isReactWarning" in i &&
                        i.isReactWarning)
                    ? n.props.ref
                    : n.props.ref || n.ref)
              : void 0,
            b = (0, a.s)(r, y);
          if (!v) {
            if (d || 0 === d) throw Error(g ? f(e) : m(e));
            return d;
          }
          let w = (function (e, t) {
            let r = { ...t };
            for (let n in t) {
              let s = e[n],
                a = t[n];
              /^on[A-Z]/.test(n)
                ? s && a
                  ? (r[n] = (...e) => {
                      let t = a(...e);
                      return (s(...e), t);
                    })
                  : s && (r[n] = s)
                : "style" === n
                  ? (r[n] = { ...s, ...a })
                  : "className" === n &&
                    (r[n] = [s, a].filter(Boolean).join(" "));
            }
            return { ...e, ...r };
          })(u, v.props ?? {});
          return (
            v.type !== s.Fragment && (w.ref = r ? b : y),
            s.cloneElement(v, w)
          );
        });
        return ((t.displayName = `${e}.Slot`), t);
      }
      var l = i("Slot"),
        o = Symbol.for("radix.slottable");
      function d(e) {
        let t = (e) => ("child" in e ? e.children(e.child) : e.children);
        return ((t.displayName = `${e}.Slottable`), (t.__radixId = o), t);
      }
      var c = (e, t) => {
          if ("child" in e.props) {
            let t = e.props.child;
            return s.isValidElement(t)
              ? s.cloneElement(t, void 0, e.props.children(t.props.children))
              : null;
          }
          return s.isValidElement(t) ? t : null;
        },
        u = Symbol.for("react.lazy");
      function p(e) {
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
      var m = (e) =>
          `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
        f = (e) =>
          `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
        h = (n || (n = r.t(s, 2)))[" use ".trim().toString()];
    },
    7244: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => n });
      let n = (0, r(2046).A)("scroll-text", [
        ["path", { d: "M15 12h-5", key: "r7krc0" }],
        ["path", { d: "M15 8h-5", key: "1khuty" }],
        ["path", { d: "M19 17V5a2 2 0 0 0-2-2H4", key: "zz82l3" }],
        [
          "path",
          {
            d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",
            key: "1ph1d7",
          },
        ],
      ]);
    },
    9977: (e, t, r) => {
      "use strict";
      r.d(t, { E: () => l });
      var n = r(4568);
      r(7620);
      var s = r(4616),
        a = r(5703);
      let i = (0, s.F)(
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
      function l(e) {
        let { className: t, variant: r, ...s } = e;
        return (0, n.jsx)("div", {
          className: (0, a.cn)(i({ variant: r }), t),
          ...s,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 1411))), (_N_E = e.O()));
  },
]);
