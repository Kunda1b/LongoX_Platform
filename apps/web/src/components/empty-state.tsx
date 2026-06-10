import React from "react";

export default function EmptyState({
  message = "Nothing here yet",
}: {
  message?: string;
}) {
  return <div className="empty-state">{message}</div>;
}
