((exports.id = 360),
  (exports.ids = [360]),
  (exports.modules = {
    10573: (a, b, c) => {
      "use strict";
      c.d(b, { cn: () => f });
      var d = c(79390),
        e = c(25442);
      function f(...a) {
        return (0, e.QP)((0, d.$)(a));
      }
    },
    14276: () => {},
    24444: (a, b, c) => {
      "use strict";
      c.d(b, { A: () => j, O: () => i });
      var d = c(78157),
        e = c(31768),
        f = c(71159);
      let g = (0, e.createContext)(null),
        h = process.env.NEXT_PUBLIC_API_URL ?? "/api";
      function i({ children: a }) {
        let b = (0, f.useRouter)(),
          [c, i] = (0, e.useState)(null),
          [j, k] = (0, e.useState)(null),
          [l, m] = (0, e.useState)(!0),
          n = (0, e.useCallback)(
            async (a, c) => {
              var d, e;
              let f = await fetch(`${h}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: a, password: c }),
              });
              if (!f.ok)
                throw Error(
                  (await f.json().catch(() => ({ error: "Login failed" })))
                    .error,
                );
              let g = await f.json();
              (k(g.token),
                i(g.user),
                (d = g.token),
                (e = g.user),
                localStorage.setItem(
                  "auth",
                  JSON.stringify({ token: d, user: e }),
                ),
                b.push("/dashboard"));
            },
            [b],
          ),
          o = (0, e.useCallback)(() => {
            (k(null),
              i(null),
              localStorage.removeItem("auth"),
              fetch(`${h}/auth/logout`, { method: "POST" }).catch(() => {}),
              b.push("/"));
          }, [b]);
        return (0, d.jsx)(g.Provider, {
          value: { user: c, token: j, isLoading: l, login: n, logout: o },
          children: a,
        });
      }
      function j() {
        let a = (0, e.useContext)(g);
        if (!a) throw Error("useAuth must be used within AuthProvider");
        return a;
      }
    },
    44552: (a, b, c) => {
      "use strict";
      c.d(b, { Providers: () => d });
      let d = (0, c(25459).registerClientReference)(
        function () {
          throw Error(
            "Attempted to call Providers() from the server but Providers is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.",
          );
        },
        "/home/ubuntu/repos/Flow-Builder-Nexus/apps/web/src/lib/providers.tsx",
        "Providers",
      );
    },
    44747: (a, b, c) => {
      "use strict";
      c.d(b, { Providers: () => q });
      var d = c(78157),
        e = c(31768),
        f = c(71366),
        g = c(32315),
        h = c(24444);
      let i = !1;
      var j = c(88721),
        k = c(10573);
      let l = j.Kq;
      (j.bL,
        j.l9,
        (e.forwardRef(({ className: a, sideOffset: b = 4, ...c }, e) =>
          (0, d.jsx)(j.ZL, {
            children: (0, d.jsx)(j.UC, {
              ref: e,
              sideOffset: b,
              className: (0, k.cn)(
                "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
                a,
              ),
              ...c,
            }),
          }),
        ).displayName = j.UC.displayName));
      var m = c(95535);
      function n() {
        return (0, d.jsx)(m.l$, {
          position: "bottom-right",
          toastOptions: {
            classNames: {
              toast:
                "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
              description: "group-[.toast]:text-muted-foreground",
              actionButton:
                "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
              cancelButton:
                "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            },
          },
        });
      }
      !(function () {
        var a;
        i ||
          ((i = !0),
          (a =
            (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "") ||
            null) && a.replace(/\/+$/, ""),
          () => null);
      })();
      let o = new f.E({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: !1 } },
      });
      function p({ children: a }) {
        return (0, d.jsx)(d.Fragment, { children: a });
      }
      function q({ children: a }) {
        return (0, d.jsx)(g.Ht, {
          client: o,
          children: (0, d.jsx)(p, {
            children: (0, d.jsx)(h.O, {
              children: (0, d.jsxs)(l, { children: [a, (0, d.jsx)(n, {})] }),
            }),
          }),
        });
      }
    },
    47570: (a, b, c) => {
      "use strict";
      (c.r(b), c.d(b, { default: () => g, metadata: () => f }));
      var d = c(5939);
      c(14276);
      var e = c(44552);
      let f = {
        title: "LongoX",
        description: "Intelligent workflow automation platform",
      };
      function g({ children: a }) {
        return (0, d.jsx)("html", {
          lang: "en",
          suppressHydrationWarning: !0,
          children: (0, d.jsx)("body", {
            className: "min-h-screen bg-background antialiased",
            children: (0, d.jsx)(e.Providers, { children: a }),
          }),
        });
      }
    },
    68254: (a, b, c) => {
      Promise.resolve().then(c.bind(c, 44747));
    },
    72982: (a, b, c) => {
      Promise.resolve().then(c.bind(c, 44552));
    },
    79048: (a, b, c) => {
      (Promise.resolve().then(c.t.bind(c, 48365, 23)),
        Promise.resolve().then(c.t.bind(c, 64596, 23)),
        Promise.resolve().then(c.t.bind(c, 56186, 23)),
        Promise.resolve().then(c.t.bind(c, 67805, 23)),
        Promise.resolve().then(c.t.bind(c, 27561, 23)),
        Promise.resolve().then(c.t.bind(c, 47569, 23)),
        Promise.resolve().then(c.t.bind(c, 42747, 23)),
        Promise.resolve().then(c.t.bind(c, 56676, 23)),
        Promise.resolve().then(c.bind(c, 97225)));
    },
    92200: (a, b, c) => {
      (Promise.resolve().then(c.t.bind(c, 58671, 23)),
        Promise.resolve().then(c.t.bind(c, 56542, 23)),
        Promise.resolve().then(c.t.bind(c, 88248, 23)),
        Promise.resolve().then(c.t.bind(c, 49743, 23)),
        Promise.resolve().then(c.t.bind(c, 96231, 23)),
        Promise.resolve().then(c.t.bind(c, 10959, 23)),
        Promise.resolve().then(c.t.bind(c, 72041, 23)),
        Promise.resolve().then(c.t.bind(c, 95094, 23)),
        Promise.resolve().then(c.t.bind(c, 67487, 23)));
    },
  }));
