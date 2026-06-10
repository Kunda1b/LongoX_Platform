(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [337],
  {
    2046: (e, t, s) => {
      "use strict";
      s.d(t, { A: () => d });
      var r = s(7620);
      let a = (e) => {
          let t = e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, s) =>
            s ? s.toUpperCase() : t.toLowerCase(),
          );
          return t.charAt(0).toUpperCase() + t.slice(1);
        },
        l = function () {
          for (var e = arguments.length, t = Array(e), s = 0; s < e; s++)
            t[s] = arguments[s];
          return t
            .filter((e, t, s) => !!e && "" !== e.trim() && s.indexOf(e) === t)
            .join(" ")
            .trim();
        };
      var n = {
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
      let i = (0, r.forwardRef)((e, t) => {
          let {
            color: s = "currentColor",
            size: a = 24,
            strokeWidth: i = 2,
            absoluteStrokeWidth: d,
            className: c = "",
            children: o,
            iconNode: u,
            ...x
          } = e;
          return (0, r.createElement)(
            "svg",
            {
              ref: t,
              ...n,
              width: a,
              height: a,
              stroke: s,
              strokeWidth: d ? (24 * Number(i)) / Number(a) : i,
              className: l("lucide", c),
              ...(!o &&
                !((e) => {
                  for (let t in e)
                    if (t.startsWith("aria-") || "role" === t || "title" === t)
                      return !0;
                })(x) && { "aria-hidden": "true" }),
              ...x,
            },
            [
              ...u.map((e) => {
                let [t, s] = e;
                return (0, r.createElement)(t, s);
              }),
              ...(Array.isArray(o) ? o : [o]),
            ],
          );
        }),
        d = (e, t) => {
          let s = (0, r.forwardRef)((s, n) => {
            let { className: d, ...c } = s;
            return (0, r.createElement)(i, {
              ref: n,
              iconNode: t,
              className: l(
                "lucide-".concat(
                  a(e)
                    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                    .toLowerCase(),
                ),
                "lucide-".concat(e),
                d,
              ),
              ...c,
            });
          });
          return ((s.displayName = a(e)), s);
        };
    },
    2840: (e, t, s) => {
      "use strict";
      s.d(t, { A: () => r });
      let r = (0, s(2046).A)("activity", [
        [
          "path",
          {
            d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
            key: "169zse",
          },
        ],
      ]);
    },
    4092: (e, t, s) => {
      "use strict";
      (s.r(t), s.d(t, { default: () => o }));
      var r = s(4568),
        a = s(8186),
        l = s(9977),
        n = s(4128),
        i = s(6878),
        d = s(2840);
      let c = (0, s(2046).A)("triangle-alert", [
        [
          "path",
          {
            d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
            key: "wmoenq",
          },
        ],
        ["path", { d: "M12 9v4", key: "juzpu7" }],
        ["path", { d: "M12 17h.01", key: "p32p05" }],
      ]);
      function o() {
        return (0, r.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, r.jsxs)("div", {
              children: [
                (0, r.jsx)("h1", {
                  className: "text-2xl font-bold tracking-tight",
                  children: "Dashboard",
                }),
                (0, r.jsx)("p", {
                  className: "text-sm text-muted-foreground",
                  children: "Overview of your workflows and system health",
                }),
              ],
            }),
            (0, r.jsxs)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
              children: [
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsxs)(a.aR, {
                      className:
                        "flex flex-row items-center justify-between pb-2",
                      children: [
                        (0, r.jsx)(a.ZB, {
                          className: "text-sm font-medium",
                          children: "Total Workflows",
                        }),
                        (0, r.jsx)(n.A, {
                          className: "h-4 w-4 text-muted-foreground",
                        }),
                      ],
                    }),
                    (0, r.jsxs)(a.Wu, {
                      children: [
                        (0, r.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "12",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "+2 from last month",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsxs)(a.aR, {
                      className:
                        "flex flex-row items-center justify-between pb-2",
                      children: [
                        (0, r.jsx)(a.ZB, {
                          className: "text-sm font-medium",
                          children: "Active Runs",
                        }),
                        (0, r.jsx)(i.A, {
                          className: "h-4 w-4 text-muted-foreground",
                        }),
                      ],
                    }),
                    (0, r.jsxs)(a.Wu, {
                      children: [
                        (0, r.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "3",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "2 running, 1 queued",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsxs)(a.aR, {
                      className:
                        "flex flex-row items-center justify-between pb-2",
                      children: [
                        (0, r.jsx)(a.ZB, {
                          className: "text-sm font-medium",
                          children: "Success Rate",
                        }),
                        (0, r.jsx)(d.A, {
                          className: "h-4 w-4 text-muted-foreground",
                        }),
                      ],
                    }),
                    (0, r.jsxs)(a.Wu, {
                      children: [
                        (0, r.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "97.5%",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "Last 24 hours",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsxs)(a.aR, {
                      className:
                        "flex flex-row items-center justify-between pb-2",
                      children: [
                        (0, r.jsx)(a.ZB, {
                          className: "text-sm font-medium",
                          children: "Failed",
                        }),
                        (0, r.jsx)(c, {
                          className: "h-4 w-4 text-muted-foreground",
                        }),
                      ],
                    }),
                    (0, r.jsxs)(a.Wu, {
                      children: [
                        (0, r.jsx)("div", {
                          className: "text-2xl font-bold",
                          children: "1",
                        }),
                        (0, r.jsx)("p", {
                          className: "text-xs text-muted-foreground",
                          children: "Requires attention",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, r.jsxs)("div", {
              className: "grid gap-4 md:grid-cols-2",
              children: [
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsx)(a.aR, {
                      children: (0, r.jsx)(a.ZB, {
                        className: "text-lg",
                        children: "Recent Workflows",
                      }),
                    }),
                    (0, r.jsx)(a.Wu, {
                      children: (0, r.jsx)("div", {
                        className: "space-y-3",
                        children: [
                          {
                            name: "Order Processing",
                            status: "active",
                            runs: 142,
                          },
                          {
                            name: "Data Sync Pipeline",
                            status: "active",
                            runs: 89,
                          },
                          {
                            name: "Email Notification",
                            status: "paused",
                            runs: 34,
                          },
                        ].map((e) =>
                          (0, r.jsxs)(
                            "div",
                            {
                              className: "flex items-center justify-between",
                              children: [
                                (0, r.jsxs)("div", {
                                  className: "flex items-center gap-2",
                                  children: [
                                    (0, r.jsx)("div", {
                                      className: "h-2 w-2 rounded-full ".concat(
                                        "active" === e.status
                                          ? "bg-emerald-500"
                                          : "bg-amber-500",
                                      ),
                                    }),
                                    (0, r.jsx)("span", {
                                      className: "text-sm",
                                      children: e.name,
                                    }),
                                  ],
                                }),
                                (0, r.jsxs)("div", {
                                  className: "flex items-center gap-2",
                                  children: [
                                    (0, r.jsxs)("span", {
                                      className:
                                        "text-xs text-muted-foreground",
                                      children: [e.runs, " runs"],
                                    }),
                                    (0, r.jsx)(l.E, {
                                      variant:
                                        "active" === e.status
                                          ? "success"
                                          : "warning",
                                      children: e.status,
                                    }),
                                  ],
                                }),
                              ],
                            },
                            e.name,
                          ),
                        ),
                      }),
                    }),
                  ],
                }),
                (0, r.jsxs)(a.Zp, {
                  children: [
                    (0, r.jsx)(a.aR, {
                      children: (0, r.jsx)(a.ZB, {
                        className: "text-lg",
                        children: "Recent Executions",
                      }),
                    }),
                    (0, r.jsx)(a.Wu, {
                      children: (0, r.jsx)("div", {
                        className: "space-y-3",
                        children: [
                          {
                            id: "exec-001",
                            workflow: "Order Processing",
                            status: "completed",
                          },
                          {
                            id: "exec-002",
                            workflow: "Data Sync Pipeline",
                            status: "running",
                          },
                          {
                            id: "exec-003",
                            workflow: "Email Notification",
                            status: "failed",
                          },
                        ].map((e) =>
                          (0, r.jsxs)(
                            "div",
                            {
                              className: "flex items-center justify-between",
                              children: [
                                (0, r.jsx)("div", {
                                  className: "flex items-center gap-2",
                                  children: (0, r.jsx)("span", {
                                    className: "text-sm",
                                    children: e.workflow,
                                  }),
                                }),
                                (0, r.jsx)(l.E, {
                                  variant:
                                    "completed" === e.status
                                      ? "success"
                                      : "running" === e.status
                                        ? "info"
                                        : "destructive",
                                  children: e.status,
                                }),
                              ],
                            },
                            e.id,
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
    4128: (e, t, s) => {
      "use strict";
      s.d(t, { A: () => r });
      let r = (0, s(2046).A)("workflow", [
        [
          "rect",
          { width: "8", height: "8", x: "3", y: "3", rx: "2", key: "by2w9f" },
        ],
        ["path", { d: "M7 11v4a2 2 0 0 0 2 2h4", key: "xkn7yn" }],
        [
          "rect",
          { width: "8", height: "8", x: "13", y: "13", rx: "2", key: "1cgmvn" },
        ],
      ]);
    },
    4616: (e, t, s) => {
      "use strict";
      s.d(t, { F: () => n });
      var r = s(2902);
      let a = (e) => ("boolean" == typeof e ? `${e}` : 0 === e ? "0" : e),
        l = r.$,
        n = (e, t) => (s) => {
          var r;
          if ((null == t ? void 0 : t.variants) == null)
            return l(
              e,
              null == s ? void 0 : s.class,
              null == s ? void 0 : s.className,
            );
          let { variants: n, defaultVariants: i } = t,
            d = Object.keys(n).map((e) => {
              let t = null == s ? void 0 : s[e],
                r = null == i ? void 0 : i[e];
              if (null === t) return null;
              let l = a(t) || a(r);
              return n[e][l];
            }),
            c =
              s &&
              Object.entries(s).reduce((e, t) => {
                let [s, r] = t;
                return (void 0 === r || (e[s] = r), e);
              }, {});
          return l(
            e,
            d,
            null == t || null == (r = t.compoundVariants)
              ? void 0
              : r.reduce((e, t) => {
                  let { class: s, className: r, ...a } = t;
                  return Object.entries(a).every((e) => {
                    let [t, s] = e;
                    return Array.isArray(s)
                      ? s.includes({ ...i, ...c }[t])
                      : { ...i, ...c }[t] === s;
                  })
                    ? [...e, s, r]
                    : e;
                }, []),
            null == s ? void 0 : s.class,
            null == s ? void 0 : s.className,
          );
        };
    },
    5703: (e, t, s) => {
      "use strict";
      s.d(t, { cn: () => l });
      var r = s(2902),
        a = s(3714);
      function l() {
        for (var e = arguments.length, t = Array(e), s = 0; s < e; s++)
          t[s] = arguments[s];
        return (0, a.QP)((0, r.$)(t));
      }
    },
    6055: (e, t, s) => {
      Promise.resolve().then(s.bind(s, 4092));
    },
    6878: (e, t, s) => {
      "use strict";
      s.d(t, { A: () => r });
      let r = (0, s(2046).A)("circle-play", [
        [
          "path",
          {
            d: "M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z",
            key: "kmsa83",
          },
        ],
        ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
      ]);
    },
    8186: (e, t, s) => {
      "use strict";
      s.d(t, {
        BT: () => c,
        Wu: () => o,
        ZB: () => d,
        Zp: () => n,
        aR: () => i,
      });
      var r = s(4568),
        a = s(7620),
        l = s(5703);
      let n = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)(
            "rounded-xl border bg-card text-card-foreground shadow-sm",
            s,
          ),
          ...a,
        });
      });
      n.displayName = "Card";
      let i = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)("flex flex-col space-y-1.5 p-6", s),
          ...a,
        });
      });
      i.displayName = "CardHeader";
      let d = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)("font-semibold leading-none tracking-tight", s),
          ...a,
        });
      });
      d.displayName = "CardTitle";
      let c = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)("text-sm text-muted-foreground", s),
          ...a,
        });
      });
      c.displayName = "CardDescription";
      let o = a.forwardRef((e, t) => {
        let { className: s, ...a } = e;
        return (0, r.jsx)("div", {
          ref: t,
          className: (0, l.cn)("p-6 pt-0", s),
          ...a,
        });
      });
      ((o.displayName = "CardContent"),
        (a.forwardRef((e, t) => {
          let { className: s, ...a } = e;
          return (0, r.jsx)("div", {
            ref: t,
            className: (0, l.cn)("flex items-center p-6 pt-0", s),
            ...a,
          });
        }).displayName = "CardFooter"));
    },
    9977: (e, t, s) => {
      "use strict";
      s.d(t, { E: () => i });
      var r = s(4568);
      s(7620);
      var a = s(4616),
        l = s(5703);
      let n = (0, a.F)(
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
        let { className: t, variant: s, ...a } = e;
        return (0, r.jsx)("div", {
          className: (0, l.cn)(n({ variant: s }), t),
          ...a,
        });
      }
    },
  },
  (e) => {
    (e.O(0, [289, 587, 18, 358], () => e((e.s = 6055))), (_N_E = e.O()));
  },
]);
