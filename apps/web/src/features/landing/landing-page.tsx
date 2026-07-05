"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Cable,
  Check,
  ChevronRight,
  Menu,
  Play,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  CONNECTOR_NAMES,
  FEATURES,
  NAV_LINKS,
  PRICING_PLANS,
  STATS,
  STEPS,
} from "./constants";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

function LandingNav() {
  const { user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100vw-2rem,18rem)]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="my-3 border-t" />
                {!isLoading && user ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground sm:size-9">
              LX
            </div>
            <span className="truncate text-base font-semibold tracking-tight sm:text-lg">
              LongoX
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {!isLoading && user ? (
            <Button asChild size="sm" className="sm:h-9">
              <Link href="/dashboard">
                Dashboard
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="sm:h-9">
                <Link href="/register">
                  <span className="hidden min-[420px]:inline">Get started</span>
                  <span className="min-[420px]:hidden">Start</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const { user } = useAuth();
  const primaryHref = user ? "/dashboard" : "/register";
  const primaryLabel = user ? "Open dashboard" : "Start building free";

  return (
    <section className="relative overflow-hidden border-b">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(240_5.9%_10%/0.08),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.4)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.4)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-32">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge
            variant="secondary"
            className="mb-6 inline-flex max-w-full flex-wrap justify-center gap-1.5 px-3 py-1 text-center text-[11px] leading-snug sm:text-xs"
          >
            <Sparkles className="size-3.5 shrink-0" />
            <span>Workflow automation · AI agents · Marketplace</span>
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Automate operations with{" "}
            <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
              intelligent workflows
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg lg:text-xl">
            LongoX combines visual workflow building, multi-provider AI routing,
            a connector marketplace, and enterprise controls — in one
            multi-tenant platform built for production.
          </p>

          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center">
            <Button size="lg" asChild className="h-11 w-full sm:w-auto sm:px-8">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 w-full sm:w-auto sm:px-8"
            >
              <Link href="/login">
                <Play className="size-4" />
                Sign in to workspace
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-10 max-w-4xl sm:mt-16"
        >
          <div className="rounded-xl border bg-card p-1 shadow-2xl shadow-foreground/5">
            <div className="rounded-lg border bg-muted/30 p-4 sm:p-6 lg:p-8">
              <div className="mb-4 flex items-center gap-2 overflow-hidden">
                <div className="size-3 shrink-0 rounded-full bg-red-400/80" />
                <div className="size-3 shrink-0 rounded-full bg-amber-400/80" />
                <div className="size-3 shrink-0 rounded-full bg-emerald-400/80" />
                <span className="ml-1 truncate text-[10px] text-muted-foreground sm:ml-2 sm:text-xs">
                  workflow-builder · customer-onboarding.flow
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Webhook trigger",
                    icon: Zap,
                    tone: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
                  },
                  {
                    label: "AI classify intent",
                    icon: Bot,
                    tone: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
                  },
                  {
                    label: "Slack notify",
                    icon: Cable,
                    tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  },
                ].map((node, i) => (
                  <div key={node.label} className="relative">
                    {i > 0 && (
                      <div className="absolute -left-3 top-1/2 hidden h-px w-3 -translate-y-1/2 bg-border sm:block" />
                    )}
                    <div className="flex items-center gap-3 rounded-lg border bg-background p-4 shadow-sm">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-md",
                          node.tone,
                        )}
                      >
                        <node.icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Step {i + 1}
                        </p>
                        <p className="text-sm font-medium">{node.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 rounded-lg border border-dashed bg-background/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                  <span className="inline-flex size-2 shrink-0 rounded-full bg-emerald-500" />
                  <span className="truncate">
                    Last run succeeded · 1.2s · 847 tokens
                  </span>
                </div>
                <Badge variant="success" className="w-fit shrink-0">
                  Production
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-2 gap-4 sm:mt-16 sm:gap-6 sm:grid-cols-4"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ConnectorsBar() {
  return (
    <section className="border-b bg-muted/20 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
          Connectors available in the marketplace
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {CONNECTOR_NAMES.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold tracking-wide text-muted-foreground/80"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Platform
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Everything you need to automate at scale
          </h2>
          <p className="mt-4 text-muted-foreground">
            From visual authoring to governed AI execution — LongoX covers the
            full lifecycle of enterprise automation.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border bg-card p-6 transition-colors hover:border-foreground/20 hover:shadow-md"
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="size-5" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-y bg-muted/20 py-14 sm:py-20 lg:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Workflow
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            From idea to production in three steps
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {i < STEPS.length - 1 && (
                <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-border md:block" />
              )}
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <span className="mb-4 flex size-12 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold">
                  {step.step}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-14 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Pricing
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Plans that scale with your automations
          </h2>
          <p className="mt-4 text-muted-foreground">
            Metered by executions and AI tokens. Upgrade anytime as your
            workflows grow.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-6 shadow-sm",
                plan.highlighted &&
                  "border-primary shadow-lg ring-1 ring-primary/20 lg:-mt-2 lg:mb-2 lg:py-8",
              )}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most popular
                </Badge>
              )}
              <div>
                <h3 className="font-semibold">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    {plan.price}
                  </span>
                  {plan.price !== "Free" && (
                    <span className="text-sm text-muted-foreground">
                      /{plan.period}
                    </span>
                  )}
                </div>
                {plan.price === "Free" && (
                  <p className="text-sm text-muted-foreground">{plan.period}</p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={plan.highlighted ? "default" : "outline"}
                asChild
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="border-t bg-primary py-14 text-primary-foreground sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to automate your operations?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
          Create your workspace in minutes. Build workflows, connect your stack,
          and ship AI-powered automations today.
        </p>
        <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="h-11 w-full sm:w-auto sm:px-8"
          >
            <Link href="/register">
              Create free account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-11 w-full border-primary-foreground/20 bg-transparent px-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
          >
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-8 text-center sm:flex-row sm:gap-6 sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              LX
            </div>
            <span className="font-semibold">LongoX</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-muted-foreground sm:justify-end">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="transition-colors hover:text-foreground"
            >
              Register
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LongoX Platform
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <HeroSection />
        <ConnectorsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
