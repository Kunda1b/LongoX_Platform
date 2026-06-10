import React from "react";

export default function PageHeader({ title }: { title?: string }) {
  return <header className="page-header">{title}</header>;
}
