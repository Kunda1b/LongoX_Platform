(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [869],
  {
    336: (e, s, a) => {
      "use strict";
      (a.r(s), a.d(s, { default: () => x }));
      var t = a(4568),
        r = a(8186),
        l = a(9977),
        n = a(5400),
        i = a(7801),
        d = a(1753),
        c = a(2888);
      let m = [
        { name: "Summarize Text", model: "GPT-4o", usage: 234, version: "v2" },
        {
          name: "Extract Data",
          model: "Claude 3.5",
          usage: 156,
          version: "v1",
        },
        { name: "Generate Report", model: "GPT-4o", usage: 89, version: "v3" },
      ];
      function x() {
        return (0, t.jsxs)("div", {
          className: "space-y-6",
          children: [
            (0, t.jsxs)("div", {
              className: "flex items-center justify-between",
              children: [
                (0, t.jsxs)("div", {
                  children: [
                    (0, t.jsx)("h1", {
                      className: "text-2xl font-bold tracking-tight",
                      children: "Prompts",
                    }),
                    (0, t.jsx)("p", {
                      className: "text-sm text-muted-foreground",
                      children: "Manage AI prompt templates",
                    }),
                  ],
                }),
                (0, t.jsxs)(n.$, {
                  children: [
                    (0, t.jsx)(i.A, { className: "mr-1 h-4 w-4" }),
                    " New Prompt",
                  ],
                }),
              ],
            }),
            (0, t.jsx)("div", {
              className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
              children: m.map((e) =>
                (0, t.jsxs)(
                  r.Zp,
                  {
                    children: [
                      (0, t.jsxs)(r.aR, {
                        children: [
                          (0, t.jsx)(d.A, {
                            className: "h-5 w-5 text-primary",
                          }),
                          (0, t.jsx)(r.ZB, {
                            className: "mt-2 text-sm",
                            children: e.name,
                          }),
                          (0, t.jsxs)(r.BT, {
                            className: "text-xs",
                            children: ["Model: ", e.model],
                          }),
                        ],
                      }),
                      (0, t.jsxs)(r.Wu, {
                        className: "flex items-center justify-between",
                        children: [
                          (0, t.jsxs)("div", {
                            className: "flex items-center gap-2",
                            children: [
                              (0, t.jsxs)("span", {
                                className: "text-xs text-muted-foreground",
                                children: [e.usage, " uses"],
                              }),
                              (0, t.jsx)(l.E, {
                                variant: "secondary",
                                children: e.version,
                              }),
                            ],
                          }),
                          (0, t.jsx)(n.$, {
                            variant: "ghost",
                            size: "icon",
                            className: "h-8 w-8",
                            children: (0, t.jsx)(c.A, { className: "h-4 w-4" }),
                          }),
                        ],
                      }),
                    ],
                  },
                  e.name,
                ),
              ),
            }),
          ],
        });
      }
    },
    1753: (e, s, a) => {
      "use strict";
      a.d(s, { A: () => t });
      let t = (0, a(2046).A)("file-text", [
        [
          "path",
          {
            d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
            key: "1rqfz7",
          },
        ],
        ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
        ["path", { d: "M10 9H8", key: "b1mrlr" }],
        ["path", { d: "M16 13H8", key: "t4e002" }],
        ["path", { d: "M16 17H8", key: "z1uh3a" }],
      ]);
    },
    7621: (e, s, a) => {
      Promise.resolve().then(a.bind(a, 336));
    },
  },
  (e) => {
    (e.O(0, [289, 552, 587, 18, 358], () => e((e.s = 7621))), (_N_E = e.O()));
  },
]);
