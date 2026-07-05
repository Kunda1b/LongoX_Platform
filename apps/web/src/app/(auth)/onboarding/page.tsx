"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Users,
  ShieldCheck,
  ChevronRight,
  Check,
  Globe,
  Key,
  Settings,
} from "lucide-react";

const steps = [
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "team", label: "Team Setup", icon: Users },
  { id: "sso", label: "SSO Configuration", icon: Key },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "done", label: "Launch", icon: Globe },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [ssoProvider, setSsoProvider] = useState("");
  const [dataRegion, setDataRegion] = useState("us");
  const [acceptRetention, setAcceptRetention] = useState(false);

  const canProceed = () => {
    switch (step) {
      case 0:
        return orgName.trim().length > 0 && orgSlug.trim().length > 0;
      case 1:
        return teamSize.length > 0;
      case 2:
        return true;
      case 3:
        return acceptRetention;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = async () => {
    try {
      await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug,
          plan: "enterprise",
          settings: {
            teamSize,
            ssoProvider,
            dataRegion,
            onboardingComplete: true,
          },
        }),
      });
      router.push("/dashboard");
    } catch {
      // fallback
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
            LX
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to LongoX
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your enterprise workspace in minutes
          </p>
        </div>

        <div className="mb-6 overflow-x-auto pb-2 sm:mb-8">
          <div className="flex min-w-[320px] items-center justify-between px-1 sm:min-w-0">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div
                  key={s.id}
                  className="flex flex-col items-center px-0.5 sm:px-0"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors sm:h-10 sm:w-10 ${
                      isDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary text-primary"
                          : "border-muted-foreground/30 text-muted-foreground/50"
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <span
                    className={`mt-1 hidden max-w-[4.5rem] truncate text-center text-[10px] font-medium sm:block sm:max-w-none sm:text-xs ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="relative mt-2 hidden sm:block">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
            <div
              className="absolute left-0 top-1/2 h-px bg-primary transition-all"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground sm:hidden">
            Step {step + 1} of {steps.length}: {steps[step].label}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[step].label}</CardTitle>
            <CardDescription>
              {step === 0 && "Tell us about your organization"}
              {step === 1 && "How many people will be using LongoX?"}
              {step === 2 && "Configure single sign-on for your team"}
              {step === 3 && "Set up data compliance preferences"}
              {step === 4 && "You're all set! Launch your workspace"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Organization Name
                  </label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workspace Slug</label>
                  <Input
                    value={orgSlug}
                    onChange={(e) =>
                      setOrgSlug(
                        e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      )
                    }
                    placeholder="acme"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your workspace URL: https://app.longox.io/
                    {orgSlug || "workspace"}
                  </p>
                </div>
              </>
            )}

            {step === 1 && (
              <div className="grid grid-cols-3 gap-3">
                {["1-10", "10-50", "50-200", "200-1000", "1000+"].map(
                  (size) => (
                    <button
                      key={size}
                      type="button"
                      className={`rounded-lg border p-4 text-center transition-colors ${
                        teamSize === size
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      }`}
                      onClick={() => setTeamSize(size)}
                    >
                      <Users className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{size}</span>
                    </button>
                  ),
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Choose an SSO provider for your organization. You can
                  configure this later in Settings.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: "saml",
                      label: "SAML 2.0",
                      desc: "Any SAML-compliant IdP",
                    },
                    {
                      id: "oidc",
                      label: "OpenID Connect",
                      desc: "Generic OIDC provider",
                    },
                    {
                      id: "azure_ad",
                      label: "Azure AD",
                      desc: "Microsoft Entra ID",
                    },
                    { id: "okta", label: "Okta", desc: "Okta Identity Cloud" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`rounded-lg border p-4 text-left transition-colors ${
                        ssoProvider === p.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/30"
                      }`}
                      onClick={() => setSsoProvider(p.id)}
                    >
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    You can skip this and configure SSO later in Settings &rarr;
                    SSO
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Data Residency Region
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "us", label: "United States" },
                      { id: "eu", label: "European Union" },
                      { id: "ap", label: "Asia Pacific" },
                      { id: "custom", label: "Custom" },
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`rounded-lg border p-3 text-center transition-colors ${
                          dataRegion === r.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/30"
                        }`}
                        onClick={() => setDataRegion(r.id)}
                      >
                        <Globe className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <input
                    type="checkbox"
                    id="retention"
                    checked={acceptRetention}
                    onChange={(e) => setAcceptRetention(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor="retention"
                    className="text-sm text-muted-foreground"
                  >
                    I agree to the data retention policy. Audit logs will be
                    retained for 90 days, and user data will be handled in
                    accordance with GDPR and applicable regulations.
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">
                  Your workspace is ready!
                </h3>
                <p className="text-sm text-muted-foreground">
                  You can now start building workflows, invite your team, and
                  configure integrations.
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 0}
                className="w-full sm:w-auto"
              >
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="w-full sm:w-auto"
                >
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="w-full sm:w-auto">
                  Launch Workspace
                  <Globe className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
