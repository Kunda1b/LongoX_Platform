(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [87],
  {
    113: (e, t, r) => {
      Promise.resolve().then(r.bind(r, 7091));
    },
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
    1715: (e, t, r) => {
      "use strict";
      r.d(t, { s: () => n });
      var s = r(7620);
      function a(e, t) {
        if ("function" == typeof e) return e(t);
        null != e && (e.current = t);
      }
      function n(...e) {
        return s.useCallback(
          (function (...e) {
            return (t) => {
              let r = !1,
                s = e.map((e) => {
                  let s = a(e, t);
                  return (r || "function" != typeof s || (r = !0), s);
                });
              if (r)
                return () => {
                  for (let t = 0; t < s.length; t++) {
                    let r = s[t];
                    "function" == typeof r ? r() : a(e[t], null);
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
      let a = (e) => {
          let t = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, r) =>
            r ? r.toUpperCase() : t.toLowerCase(),
          );
          return t.charAt(0).toUpperCase() + t.slice(1);
        },
        n = function () {
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
            size: a = 24,
            strokeWidth: i = 2,
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
              ...l,
              width: a,
              height: a,
              stroke: r,
              strokeWidth: o ? (24 * Number(i)) / Number(a) : i,
              className: n("lucide", d),
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
          let r = (0, s.forwardRef)((r, l) => {
            let { className: o, ...d } = r;
            return (0, s.createElement)(i, {
              ref: l,
              iconNode: t,
              className: n(
                "lucide-".concat(
                  a(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                o,
              ),
              ...d,
            });
          });
          return ((r.displayName = a(e)), r);
        };
    },
    4616: (e, t, r) => {
      "use strict";
      r.d(t, { F: () => l });
      var s = r(2902);
      let a = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        n = s.$,
        l = (e, t) => (r) => {
          var s;
          if ((null == t ? void 0 : t.variants) == null)
            return n(
              e,
              null == r ? void 0 : r.class,
              null == r ? void 0 : r.className,
            );
          let { variants: l, defaultVariants: i } = t,
            o = Object.keys(l).map((e) => {
              let t = null == r ? void 0 : r[e],
                s = null == i ? void 0 : i[e];
              if (null === t) return null;
              let n = a(t) || a(s);
              return l[e][n];
            }),
            d =
              r &&
              Object.entries(r).reduce((e, t) => {
                let [r, s] = t;
                return (void 0 === s || (e[r] = s), e);
              }, {});
          return n(
            e,
            o,
            null == t || null == (s = t.compoundVariants)
              ? void 0
              : s.reduce((e, t) => {
                  let { class: r, className: s, ...a } = t;
                  return Object.entries(a).every((e) => {
                    let [t, r] = e;
                    return Array.isArray(r)
                      ? r.includes({ ...i, ...d }[t])
                      : { ...i, ...d }[t] === r;
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
      r.d(t, { $: () => d });
      var s = r(4568),
        a = r(7620),
        n = r(6118),
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
        d = a.forwardRef((e, t) => {
          let { className: r, variant: a, size: l, asChild: d = !1, ...c } = e,
            u = d ? n.DX : "button";
          return (0, s.jsx)(u, {
            className: (0, i.cn)(o({ variant: a, size: l, className: r })),
            ref: t,
            ...c,
          });
        });
      d.displayName = "Button";
    },
    5693: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => s });
      let s = (0, r(2046).A)("key-round", [
        [
          "path",
          {
            d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
            key: "1s6t7t",
          },
        ],
        [
          "circle",
          {
            cx: "16.5",
            cy: "7.5",
            r: ".5",
            fill: "currentColor",
            key: "w0ekpg",
          },
        ],
      ]);
    },
    5703: (e, t, r) => {
      "use strict";
      r.d(t, { cn: () => n });
      var s = r(2902),
        a = r(3714);
      function n() {
        for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
          t[r] = arguments[r];
        return (0, a.QP)((0, s.$)(t));
      }
    },
    6118: (e, t, r) => {
      "use strict";
      r.d(t, { DX: () => i, Dc: () => d, TL: () => l });
      var s,
        a = r(7620),
        n = r(1715);
      function l(e) {
        let t = a.forwardRef((t, r) => {
          var s;
          let l,
            i,
            { children: d, ...u } = t,
            v = null,
            y = !1,
            g = [];
          (p(d) && "function" == typeof h && (d = h(d._payload)),
            a.Children.forEach(d, (e) => {
              var t;
              if (
                ((t = e),
                a.isValidElement(t) &&
                  "function" == typeof t.type &&
                  "__radixId" in t.type &&
                  t.type.__radixId === o)
              ) {
                y = !0;
                let t = "child" in e.props ? e.props.child : e.props.children;
                (p(t) && "function" == typeof h && (t = h(t._payload)),
                  (v = c(e, t)),
                  g.push(v?.props?.children));
              } else g.push(e);
            }),
            v
              ? (v = a.cloneElement(v, void 0, g))
              : !y &&
                1 === a.Children.count(d) &&
                a.isValidElement(d) &&
                (v = d));
          let x = v
              ? ((s = v),
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
            b = (0, n.s)(r, x);
          if (!v) {
            if (d || 0 === d) throw Error(y ? m(e) : f(e));
            return d;
          }
          let k = (function (e, t) {
            let r = { ...t };
            for (let s in t) {
              let a = e[s],
                n = t[s];
              /^on[A-Z]/.test(s)
                ? a && n
                  ? (r[s] = (...e) => {
                      let t = n(...e);
                      return (a(...e), t);
                    })
                  : a && (r[s] = a)
                : "style" === s
                  ? (r[s] = { ...a, ...n })
                  : "className" === s &&
                    (r[s] = [a, n].filter(Boolean).join(" "));
            }
            return { ...e, ...r };
          })(u, v.props ?? {});
          return (
            v.type !== a.Fragment && (k.ref = r ? b : x),
            a.cloneElement(v, k)
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
            return a.isValidElement(t)
              ? a.cloneElement(t, void 0, e.props.children(t.props.children))
              : null;
          }
          return a.isValidElement(t) ? t : null;
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
      var f = (e) =>
          `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
        m = (e) =>
          `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
        h = (s || (s = r.t(a, 2)))[" use ".trim().toString()];
    },
    7091: (e, t, r) => {
      "use strict";
      (r.r(t), r.d(t, { default: () => u }));
      var s = r(4568),
        a = r(9977),
        n = r(5400),
        l = r(7801),
        i = r(5693);
      let o = (0, r(2046).A)("eye", [
        [
          "path",
          {
            d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
            key: "1nclc0",
          },
        ],
        ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
      ]);
      var d = r(670);
      let c = [
        {
          name: "Slack API Token",
          type: "api_key",
          status: "valid",
          lastUsed: "2 hours ago",
        },
        {
          name: "PostgreSQL Password",
          type: "password",
          status: "valid",
          lastUsed: "5 hours ago",
        },
        {
          name: "GitHub PAT",
          type: "token",
          status: "expired",
          lastUsed: "3 days ago",
        },
        {
          name: "AWS Access Key",
          type: "access_key",
          status: "valid",
          lastUsed: "1 day ago",
        },
      ];
      function u() {
        return (0, s.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, s.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, s.jsxs)("div", {
                  children: [
                    (0, s.jsx)("h1", {
                      className: "text-2xl font-bold tracking-tight",
                      children: "Credentials",
                    }),
                    (0, s.jsx)("p", {
                      className: "text-sm text-muted-foreground",
                      children: "Securely store and manage secrets",
                    }),
                  ],
                }),
                (0, s.jsxs)(n.$, {
                  children: [
                    (0, s.jsx)(l.A, { className: "mr-1 h-4 w-4" }),
                    " Add Credential",
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
                      children: "Name",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-2",
                      children: "Type",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-2",
                      children: "Status",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-3",
                      children: "Last Used",
                    }),
                    (0, s.jsx)("div", {
                      className: "col-span-2",
                      children: "Actions",
                    }),
                  ],
                }),
                c.map((e) =>
                  (0, s.jsxs)(
                    "div",
                    {
                      className:
                        "grid grid-cols-12 gap-4 border-b px-4 py-3 text-sm last:border-0",
                      children: [
                        (0, s.jsxs)("div", {
                          className:
                            "col-span-3 flex items-center gap-2 font-medium",
                          children: [
                            (0, s.jsx)(i.A, {
                              className: "h-4 w-4 text-muted-foreground",
                            }),
                            e.name,
                          ],
                        }),
                        (0, s.jsx)("div", {
                          className:
                            "col-span-2 text-muted-foreground capitalize",
                          children: e.type.replace("_", " "),
                        }),
                        (0, s.jsx)("div", {
                          className: "col-span-2",
                          children: (0, s.jsx)(a.E, {
                            variant:
                              "valid" === e.status ? "success" : "destructive",
                            children: e.status,
                          }),
                        }),
                        (0, s.jsx)("div", {
                          className: "col-span-3 text-muted-foreground",
                          children: e.lastUsed,
                        }),
                        (0, s.jsxs)("div", {
                          className: "col-span-2 flex gap-1",
                          children: [
                            (0, s.jsx)(n.$, {
                              variant: "ghost",
                              size: "icon",
                              className: "h-8 w-8",
                              children: (0, s.jsx)(o, { className: "h-4 w-4" }),
                            }),
                            (0, s.jsx)(n.$, {
                              variant: "ghost",
                              size: "icon",
                              className: "h-8 w-8 text-destructive",
                              children: (0, s.jsx)(d.A, {
                                className: "h-4 w-4",
                              }),
                            }),
                          ],
                        }),
                      ],
                    },
                    e.name,
                  ),
                ),
              ],
            }),
          ],
        });
      }
    },
    7801: (e, t, r) => {
      "use strict";
      r.d(t, { A: () => s });
      let s = (0, r(2046).A)("plus", [
        ["path", { d: "M5 12h14", key: "1ays0h" }],
        ["path", { d: "M12 5v14", key: "s699le" }],
      ]);
    },
    9977: (e, t, r) => {
      "use strict";
      r.d(t, { E: () => i });
      var s = r(4568);
      r(7620);
      var a = r(4616),
        n = r(5703);
      let l = (0, a.F)(
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
        let { className: t, variant: r, ...a } = e;
        return (0, s.jsx)("div", {
          className: (0, n.cn)(l({ variant: r }), t),
          ...a,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 113))), (_N_E = e.O()));
  },
]);
