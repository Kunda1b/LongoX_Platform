(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [938],
  {
    670: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => s });
      let s = (0, r(2046).A)("trash-2", [
        ["path", { d: "M10 11v6", key: "nco0om" }],
        ["path", { d: "M14 11v6", key: "outv1u" }],
        [
          "path",
          { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" },
        ],
        ["path", { d: "M3 6h18", key: "d0wm0j" }],
        [
          "path",
          { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" },
        ],
      ]);
    },
    1269: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => d }));
      var s = r(4568),
        n = r(5400),
        l = r(5077),
        i = r(6380),
        a = r(670);
      let o = [
        {
          id: "msg-001",
          workflow: "Order Processing",
          error: "Slack API timeout",
          date: "2 min ago",
          retries: 3,
        },
        {
          id: "msg-002",
          workflow: "Data Sync",
          error: "Postgres connection refused",
          date: "1 hour ago",
          retries: 5,
        },
        {
          id: "msg-003",
          workflow: "Email Notification",
          error: "SendGrid quota exceeded",
          date: "3 hours ago",
          retries: 2,
        },
      ];
      function d() {
        return (0, s.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, s.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, s.jsxs)("div", {
                  className: "flex items-center gap-2",
                  children: [
                    (0, s.jsx)(l.A, { className: "h-5 w-5" }),
                    (0, s.jsxs)("div", {
                      children: [
                        (0, s.jsx)("h1", {
                          className: "text-2xl font-bold tracking-tight",
                          children: "Dead Letter Queue",
                        }),
                        (0, s.jsx)("p", {
                          className: "text-sm text-muted-foreground",
                          children:
                            "Failed messages that could not be processed",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, s.jsxs)("div", {
                  className: "flex gap-2",
                  children: [
                    (0, s.jsxs)(n.$, {
                      variant: "outline",
                      size: "sm",
                      children: [
                        (0, s.jsx)(i.A, { className: "mr-1 h-4 w-4" }),
                        " Retry All",
                      ],
                    }),
                    (0, s.jsxs)(n.$, {
                      variant: "destructive",
                      size: "sm",
                      children: [
                        (0, s.jsx)(a.A, { className: "mr-1 h-4 w-4" }),
                        " Clear All",
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, s.jsxs)("div", {
              className: "rounded-lg border",
              children: [
                (0, s.jsxs)("div", {
                  className:
                    "grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground",
                  children: [
                    (0, s.jsx)("div", {
                      className: "col-span-3",
                      children: "ID",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-2",
                      children: "Workflow",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-3",
                      children: "Error",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-2",
                      children: "Date",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-2",
                      children: "Actions",
                    }),
                  ],
                }),
                o.map((e) =>
                  (0, s.jsxs)(
                    "div",
                    {
                      className:
                        "grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm last:border-0",
                      children: [
                        (0, s.jsx)("div", {
                          className: "col-span-3 font-mono text-xs",
                          children: e.id,
                        }),
                        (0, s.jsx)("div", {
                          className: "col-span-2",
                          children: e.workflow,
                        }),
                        (0, s.jsx)("div", {
                          className: "col-span-3 text-destructive text-xs",
                          children: e.error,
                        }),
                        (0, s.jsx)("div", {
                          className: "col-span-2 text-muted-foreground text-xs",
                          children: e.date,
                        }),
                        (0, s.jsxs)("div", {
                          className: "col-span-2 flex gap-1",
                          children: [
                            (0, s.jsx)(n.$, {
                              variant: "ghost",
                              size: "icon",
                              className: "h-8 w-8",
                              children: (0, s.jsx)(i.A, {
                                className: "h-4 w-4",
                              }),
                            }),
                            (0, s.jsx)(n.$, {
                              variant: "ghost",
                              size: "icon",
                              className: "h-8 w-8 text-destructive",
                              children: (0, s.jsx)(a.A, {
                                className: "h-4 w-4",
                              }),
                            }),
                          ],
                        }),
                      ],
                    },
                    e.id,
                  ),
                ),
              ],
            }),
          ],
        });
      }
    },
    1715: (e, t, r) => {
      "use strict";
      r.d(t, { s: () => l });
      var s = r(7620);
      function n(e, t) {
        if ("function" == typeof e) return e(t);
        null != e && (e.current = t);
      }
      function l(...e) {
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
      r.d(t, { A: () => o });
      var s = r(7620);
      let n = (e) => {
          let t = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, r) =>
            r ? r.toUpperCase() : t.toLowerCase(),
          );
          return t.charAt(0).toUpperCase() + t.slice(1);
        },
        l = function () {
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
      let a = (0, s.forwardRef)((e, t) => {
          let {
            color: r = "currentColor",
            size: n = 24,
            strokeWidth: a = 2,
            absoluteStrokeWidth: o,
            className: d = "",
            children: c,
            iconNode: u,
            ...p
          } = e;
          return (0, s.createElement)(
            "svg",
            {
              ref: t,
              ...i,
              width: n,
              height: n,
              stroke: r,
              strokeWidth: o ? (24 * Number(a)) / Number(n) : a,
              className: l("lucide", d),
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
                return (0, s.createElement)(t, r);
              }),
              ...(Array.isArray(c) ? c : [c]),
            ],
          );
        }),
        o = (e, t) => {
          let r = (0, s.forwardRef)((r, i) => {
            let { className: o, ...d } = r;
            return (0, s.createElement)(a, {
              ref: i,
              iconNode: t,
              className: l(
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
    4616: (e, t, r) => {
      "use strict";
      r.d(t, { F: () => i });
      var s = r(2902);
      let n = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        l = s.$,
        i = (e, t) => (r) => {
          var s;
          if ((null == t ? void 0 : t.variants) == null)
            return l(
              e,
              null == r ? void 0 : r.class,
              null == r ? void 0 : r.className,
            );
          let { variants: i, defaultVariants: a } = t,
            o = Object.keys(i).map((e) => {
              let t = null == r ? void 0 : r[e],
                s = null == a ? void 0 : a[e];
              if (null === t) return null;
              let l = n(t) || n(s);
              return i[e][l];
            }),
            d =
              r &&
              Object.entries(r).reduce((e, t) => {
                let [r, s] = t;
                return (void 0 === s || (e[r] = s), e);
              }, {});
          return l(
            e,
            o,
            null == t || null == (s = t.compoundVariants)
              ? void 0
              : s.reduce((e, t) => {
                  let { class: r, className: s, ...n } = t;
                  return Object.entries(n).every((e) => {
                    let [t, r] = e;
                    return Array.isArray(r)
                      ? r.includes({ ...a, ...d }[t])
                      : { ...a, ...d }[t] === r;
                  })
                    ? [...e, r, s]
                    : e;
                }, []),
            null == r ? void 0 : r.class,
            null == r ? void 0 : r.className,
          );
        };
    },
    5077: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => s });
      let s = (0, r(2046).A)("hard-drive", [
        ["line", { x1: "22", x2: "2", y1: "12", y2: "12", key: "1y58io" }],
        [
          "path",
          {
            d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
            key: "oot6mr",
          },
        ],
        ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16", key: "sgf278" }],
        ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16", key: "1l4acy" }],
      ]);
    },
    5400: (e, t, r) => {
      "use strict";
      r.d(t, { $: () => d });
      var s = r(4568),
        n = r(7620),
        l = r(6118),
        i = r(4616),
        a = r(5703);
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
        d = n.forwardRef((e, t) => {
          let { className: r, variant: n, size: i, asChild: d = !1, ...c } = e,
            u = d ? l.DX : "button";
          return (0, s.jsx)(u, {
            className: (0, a.cn)(o({ variant: n, size: i, className: r })),
            ref: t,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5703: (e, t, r) => {
      "use strict";
      r.d(t, { cn: () => l });
      var s = r(2902),
        n = r(3714);
      function l() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
          t[r] = arguments[r];
        return (0, n.QP)((0, s.$)(t));
      }
    },
    6118: (e, t, r) => {
      "use strict";
      r.d(t, { DX: () => a, Dc: () => d, TL: () => i });
      var s,
        n = r(7620),
        l = r(1715);
      function i(e) {
        let t = n.forwardRef((t, r) => {
          var s;
          let i,
            a,
            { children: d, ...u } = t,
            v = null,
            x = !1,
            g = [];
          (p(d) && "function" == typeof m && (d = m(d._payload)),
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
                (p(t) && "function" == typeof m && (t = m(t._payload)),
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
              ? ((s = v),
                (a =
                  (i = Object.getOwnPropertyDescriptor(s.props, "ref")?.get) &&
                  "isReactWarning" in i &&
                  i.isReactWarning)
                  ? s.ref
                  : (a =
                        (i = Object.getOwnPropertyDescriptor(s, "ref")?.get) &&
                        "isReactWarning" in i &&
                        i.isReactWarning)
                    ? s.props.ref
                    : s.props.ref || s.ref)
              : void 0,
            b = (0, l.s)(r, y);
          if (!v) {
            if (d || 0 === d) throw Error(x ? f(e) : h(e));
            return d;
          }
          let w = (function (e, t) {
            let r = { ...t };
            for (let s in t) {
              let n = e[s],
                l = t[s];
              /^on[A-Z]/.test(s)
                ? n && l
                  ? (r[s] = (...e) => {
                      let t = l(...e);
                      return (n(...e), t);
                    })
                  : n && (r[s] = n)
                : "style" === s
                  ? (r[s] = { ...n, ...l })
                  : "className" === s &&
                    (r[s] = [n, l].filter(Boolean).join(" "));
            }
            return { ...e, ...r };
          })(u, v.props ?? {});
          return (
            v.type !== n.Fragment && (w.ref = r ? b : y),
            n.cloneElement(v, w)
          );
        });
        return ((t.displayName = `${e}.Slot`), t);
      }
      var a = i("Slot"),
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
      var h = (e) =>
          `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
        f = (e) =>
          `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
        m = (s || (s = r.t(n, 2)))[" use ".trim().toString()];
    },
    6380: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => s });
      let s = (0, r(2046).A)("rotate-ccw", [
        [
          "path",
          {
            d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
            key: "1357e3",
          },
        ],
        ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
      ]);
    },
    8606: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 1269));
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 8606))), (_N_E = e.O()));
  },
]);
