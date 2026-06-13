import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/landing-page";

export const metadata: Metadata = {
  title: "LongoX — Intelligent Workflow Automation Platform",
  description:
    "Build visual workflows, route AI across providers, install marketplace connectors, and run enterprise automations at scale.",
  openGraph: {
    title: "LongoX — Intelligent Workflow Automation Platform",
    description:
      "Workflow automation, AI agents, connector marketplace, and enterprise controls in one platform.",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
