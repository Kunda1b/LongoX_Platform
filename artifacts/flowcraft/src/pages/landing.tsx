import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Workflow,
  Menu,
  X,
  Zap,
  GitBranch,
  Sparkles,
  Database,
  Globe,
  Mail,
  Play,
  Check,
  ArrowRight,
  ChevronRight,
  Code2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-indigo-500/30 selection:text-indigo-900">
      {/* 1. Nav */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 border-b border-transparent ${scrolled ? "bg-background/80 backdrop-blur-md border-border shadow-sm" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <Workflow className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-foreground">
                LongoX
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <Link
                href="/templates"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Templates
              </Link>
              <a
                href="#connectors"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Connectors
              </a>
              <a
                href="#analytics"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Analytics
              </a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Button
                asChild
                variant="ghost"
                className="font-medium hover:bg-transparent hover:text-indigo-600"
              >
                <Link href="/dashboard">Sign in</Link>
              </Button>
              <Button
                asChild
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-medium"
              >
                <Link href="/dashboard">Get started free</Link>
              </Button>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-foreground p-2"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background pt-16">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <a
              href="#features"
              className="block px-3 py-2 text-base font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <Link
              href="/templates"
              className="block px-3 py-2 text-base font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Templates
            </Link>
            <a
              href="#connectors"
              className="block px-3 py-2 text-base font-medium text-foreground hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Connectors
            </a>
            <div className="pt-4 border-t border-border flex flex-col gap-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-center"
              >
                <Link href="/dashboard">Sign in</Link>
              </Button>
              <Button
                asChild
                className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Link href="/dashboard">Get started free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24 pb-16">
        {/* 2. Hero section */}
        <section className="relative px-4 pt-16 pb-20 sm:pt-24 lg:pt-32 text-center max-w-7xl mx-auto overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-background to-background dark:from-indigo-900/20"></div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Now in open beta
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tight text-foreground leading-[1.1] mb-6 max-w-4xl mx-auto">
            Automate anything.
            <br />
            Ship internal tools fast.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            LongoX connects your stack with visual workflows and drag-drop
            internal apps — no engineers needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto text-base h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all hover:scale-[1.02]"
            >
              <Link href="/dashboard">Start building free</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto text-base h-12 px-8 border border-border/50 bg-background/50 backdrop-blur hover:bg-muted"
            >
              <Link href="/templates" className="gap-2">
                Browse templates <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground/80 font-medium tracking-wide">
            No credit card required · 15 connectors · 30+ node types
          </p>

          {/* Hero Visual */}
          <div className="mt-16 sm:mt-24 relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl -z-10 rounded-full transform scale-y-50 -translate-y-1/4"></div>

            <div className="rounded-xl border border-white/10 bg-[#0F0F11] shadow-2xl overflow-hidden relative p-8 md:p-12">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative z-10">
                {/* Node 1 */}
                <div className="bg-[#1A1A1E] border border-white/10 rounded-lg p-4 w-64 shadow-lg shrink-0 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-cyan-500/20 text-cyan-400">
                      <Play className="w-4 h-4" />
                    </div>
                    <div className="font-medium text-white/90">Schedule</div>
                  </div>
                  <div className="text-xs text-white/50 border border-white/5 rounded px-2 py-1.5 bg-black/20 inline-block w-full">
                    Every day at 9:00 AM
                  </div>
                </div>

                <div className="hidden md:block w-8 border-t-2 border-dashed border-white/20"></div>
                <div className="md:hidden h-8 border-l-2 border-dashed border-white/20"></div>

                {/* Node 2 */}
                <div className="bg-[#1A1A1E] border border-white/10 rounded-lg p-4 w-64 shadow-lg shrink-0 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-indigo-500/20 text-indigo-400">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="font-medium text-white/90">
                      Fetch Sheet Data
                    </div>
                  </div>
                  <div className="text-xs text-white/50 border border-white/5 rounded px-2 py-1.5 bg-black/20 inline-block w-full truncate">
                    Customers 2026 Q1
                  </div>
                </div>

                <div className="hidden md:block w-8 border-t-2 border-dashed border-white/20"></div>
                <div className="md:hidden h-8 border-l-2 border-dashed border-white/20"></div>

                {/* Node 3 */}
                <div className="bg-[#1A1A1E] border border-indigo-500/30 rounded-lg p-4 w-64 shadow-[0_0_20px_rgba(99,102,241,0.15)] shrink-0 text-left relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-purple-500/20 text-purple-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="font-medium text-white/90">
                      AI Summarize
                    </div>
                  </div>
                  <div className="text-xs text-white/50 border border-white/5 rounded px-2 py-1.5 bg-black/20 inline-block w-full truncate">
                    Summarize feedback
                  </div>
                </div>

                <div className="hidden lg:block w-8 border-t-2 border-dashed border-white/20"></div>

                {/* Node 4 (Hidden on smaller screens to fit) */}
                <div className="hidden lg:block bg-[#1A1A1E] border border-white/10 rounded-lg p-4 w-64 shadow-lg shrink-0 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-md bg-pink-500/20 text-pink-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="font-medium text-white/90">Send Email</div>
                  </div>
                  <div className="text-xs text-white/50 border border-white/5 rounded px-2 py-1.5 bg-black/20 inline-block w-full truncate">
                    To: ops-team@acme.com
                  </div>
                </div>
              </div>

              {/* Fake UI chrome around it */}
              <div className="absolute top-0 inset-x-0 h-10 border-b border-white/10 flex items-center px-4 justify-between bg-white/5">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                </div>
                <div className="text-xs font-medium text-white/40">
                  Daily Sales Summary
                </div>
                <div className="flex gap-2">
                  <div className="text-xs bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded font-medium">
                    Publish
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Logo bar */}
        <section className="py-10 border-y border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
              Connects to the tools your team already uses
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: "Slack", color: "bg-purple-500" },
                { name: "Google Sheets", color: "bg-emerald-500" },
                { name: "Stripe", color: "bg-indigo-500" },
                { name: "GitHub", color: "bg-gray-800 dark:bg-white" },
                { name: "PostgreSQL", color: "bg-blue-500" },
                { name: "HubSpot", color: "bg-orange-500" },
                { name: "Notion", color: "bg-black dark:bg-white" },
                { name: "Twilio", color: "bg-red-500" },
              ].map((connector) => (
                <div
                  key={connector.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border shadow-sm"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${connector.color}`}
                  ></div>
                  <span className="text-sm font-medium text-foreground">
                    {connector.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Feature sections */}
        <section
          id="features"
          className="py-24 space-y-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Section A */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold">
                <GitBranch className="w-4 h-4" /> Automation
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Build automation workflows in minutes
              </h2>
              <p className="text-lg text-muted-foreground">
                Chain triggers, actions, logic branches, and AI nodes together
                on a visual canvas. Zapier-style simplicity, n8n-style power.
              </p>
              <ul className="space-y-4 pt-2">
                {[
                  "30+ built-in node types",
                  "AI and LLM nodes built in",
                  "Conditional branching, loops, and routers",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-foreground font-medium"
                  >
                    <div className="p-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full max-w-md bg-muted rounded-2xl p-8 border border-border flex flex-col gap-4 relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/10 to-transparent blur-xl rounded-3xl -z-10"></div>
              {/* Mini cards */}
              <div className="bg-background rounded-xl p-4 border border-border shadow-sm flex items-center gap-4 transform -translate-x-4">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-lg">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">If / Else</div>
                  <div className="text-xs text-muted-foreground">
                    Branch workflow logic
                  </div>
                </div>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border shadow-sm flex items-center gap-4">
                <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">LLM Prompt</div>
                  <div className="text-xs text-muted-foreground">
                    Generate text via AI
                  </div>
                </div>
              </div>
              <div className="bg-background rounded-xl p-4 border border-border shadow-sm flex items-center gap-4 transform translate-x-4">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">HTTP Request</div>
                  <div className="text-xs text-muted-foreground">
                    Call external APIs
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section B */}
          <div
            className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-24"
            id="connectors"
          >
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
                <Zap className="w-4 h-4" /> Integrations
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                One-click connectors for your whole stack
              </h2>
              <p className="text-lg text-muted-foreground">
                Browse and install from 15+ pre-built connectors. Each comes
                with triggers and actions ready to drop into any workflow.
              </p>
              <ul className="space-y-4 pt-2">
                {[
                  "Slack, Stripe, GitHub, HubSpot and more",
                  "Install in one click, configure in seconds",
                  "Build your own via HTTP Request node",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-foreground font-medium"
                  >
                    <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-indigo-500/5 rounded-3xl -z-10 scale-110"></div>
                {[
                  { n: "Slack", c: "bg-purple-500" },
                  { n: "Stripe", c: "bg-indigo-500" },
                  { n: "GitHub", c: "bg-gray-800" },
                  { n: "HubSpot", c: "bg-orange-500" },
                  { n: "Postgres", c: "bg-blue-500" },
                  { n: "Twilio", c: "bg-red-500" },
                ].map((c) => (
                  <div
                    key={c.n}
                    className="bg-background border border-border p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center shadow-sm hover:border-emerald-500/50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg ${c.c} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {c.n[0]}
                    </div>
                    <span className="font-semibold text-sm">{c.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section C */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                <Code2 className="w-4 h-4" /> Internal Tools
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Build dashboards and CRUD apps without code
              </h2>
              <p className="text-lg text-muted-foreground">
                Create dashboards, forms, reports, and data views for your team.
                Publish with one click. No frontend engineers needed.
              </p>
              <ul className="space-y-4 pt-2">
                {[
                  "4 app types: dashboard, CRUD, form, report",
                  "Publish privately to your team",
                  "View usage analytics per app",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-foreground font-medium"
                  >
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full max-w-md bg-muted/50 rounded-2xl p-8 border border-border">
              <div className="flex flex-col gap-4">
                <div className="bg-background rounded-xl p-5 border border-border shadow-sm flex items-start gap-4">
                  <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-lg mt-0.5">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Dashboard</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Visualize data with charts and metrics
                    </div>
                  </div>
                </div>
                <div className="bg-background rounded-xl p-5 border border-border shadow-sm flex items-start gap-4">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg mt-0.5">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">CRUD App</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Interface to view and edit database rows
                    </div>
                  </div>
                </div>
                <div className="bg-background rounded-xl p-5 border border-border shadow-sm flex items-start gap-4">
                  <div className="p-2.5 bg-orange-500/10 text-orange-600 rounded-lg mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Report</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Static data reports generated from workflows
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Node types grid */}
        <section className="py-24 bg-muted/30 border-y border-border overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
                Every building block you need
              </h2>
              <p className="text-muted-foreground text-lg">
                30+ node types across 5 categories — triggers, actions, logic,
                AI, and data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                {
                  name: "Triggers",
                  icon: Play,
                  color: "text-cyan-500",
                  bg: "bg-cyan-500/10",
                  count: "8+",
                  examples: ["Schedule", "Webhook", "Email", "Form"],
                },
                {
                  name: "Actions",
                  icon: Zap,
                  color: "text-indigo-500",
                  bg: "bg-indigo-500/10",
                  count: "15+",
                  examples: [
                    "HTTP Request",
                    "Send Email",
                    "Slack",
                    "Database Query",
                  ],
                },
                {
                  name: "Logic",
                  icon: GitBranch,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                  count: "6+",
                  examples: ["If / Else", "Router", "Loop", "Filter", "Delay"],
                },
                {
                  name: "AI",
                  icon: Sparkles,
                  color: "text-purple-500",
                  bg: "bg-purple-500/10",
                  count: "4+",
                  examples: [
                    "LLM Prompt",
                    "Classifier",
                    "Web Scraper",
                    "AI Agent",
                  ],
                },
                {
                  name: "Data",
                  icon: Database,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                  count: "5+",
                  examples: [
                    "Transform",
                    "Code (JS)",
                    "Document Parser",
                    "Variables",
                  ],
                },
              ].map((category) => (
                <div
                  key={category.name}
                  className="bg-background rounded-xl p-6 border border-border shadow-sm"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`p-2.5 rounded-lg ${category.bg} ${category.color}`}
                    >
                      <category.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-1 rounded-md">
                      {category.count}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-4">{category.name}</h3>
                  <ul className="space-y-2.5">
                    {category.examples.map((ex) => (
                      <li
                        key={ex}
                        className="text-sm font-medium text-muted-foreground flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"></div>
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Stats bar */}
        <section className="py-16 bg-[#0F0F11] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x-0 md:divide-x divide-white/10">
              <div className="flex flex-col items-center justify-center p-4">
                <div className="text-4xl md:text-5xl font-bold mb-2">15+</div>
                <div className="text-white/60 font-medium">
                  Pre-built connectors
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <div className="text-4xl md:text-5xl font-bold mb-2">30+</div>
                <div className="text-white/60 font-medium">Node types</div>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <div className="text-4xl md:text-5xl font-bold mb-2">12</div>
                <div className="text-white/60 font-medium">
                  Workflow templates
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4">
                <div className="text-4xl md:text-5xl font-bold mb-2">4</div>
                <div className="text-white/60 font-medium">App types</div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Final CTA section */}
        <section className="py-24 px-4 max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-[#0F0F11] border border-indigo-500/20 p-10 md:p-16 text-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-600/20 pointer-events-none"></div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
              Ready to automate your ops?
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto relative z-10">
              Start with a template or build from scratch. Free to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base h-12 bg-transparent text-white border-white/20 hover:bg-white/10"
              >
                <Link href="/templates" className="gap-2">
                  Browse templates <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto text-base h-12 bg-indigo-600 hover:bg-indigo-500 text-white border-0"
              >
                <Link href="/dashboard" className="gap-2">
                  Launch the app <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer */}
      <footer className="bg-background border-t border-border pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                  <Workflow className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-foreground">
                  LongoX
                </span>
              </div>
              <p className="text-muted-foreground text-sm max-w-xs">
                Low-code automation for every team.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/workflows"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Workflows
                  </Link>
                </li>
                <li>
                  <Link
                    href="/templates"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Templates
                  </Link>
                </li>
                <li>
                  <Link
                    href="/connectors"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Connectors
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Tools</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/apps"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Apps
                  </Link>
                </li>
                <li>
                  <Link
                    href="/analytics"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link
                    href="/credentials"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Credentials
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center justify-start md:justify-end h-full">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" /> Made with
                  LongoX
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 LongoX · All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
