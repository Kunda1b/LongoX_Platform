import React from "react";

export default function StatsGrid({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <div className="stats-grid">{children}</div>;
}
