import { Badge } from "@/components/ui/badge";
import {
  ActivityItemStatus,
  AppStatus,
  AppType,
  ExecutionDetailStatus,
  ExecutionStatus,
  ExecutionStepStatus,
  WorkflowStatus,
  WorkflowUpdateStatus,
} from "@longox/api-client-react";

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
    case "published":
    case "success":
      return (
        <Badge
          variant="default"
          className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
        >
          {status}
        </Badge>
      );
    case "inactive":
    case "draft":
    case "skipped":
    case "cancelled":
      return (
        <Badge
          variant="secondary"
          className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-gray-500/20"
        >
          {status}
        </Badge>
      );
    case "running":
      return (
        <Badge
          variant="default"
          className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"
        >
          {status}
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="destructive"
          className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"
        >
          {status}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function TypeBadge({ type }: { type: string }) {
  switch (type) {
    case "dashboard":
      return (
        <Badge
          variant="outline"
          className="bg-purple-500/10 text-purple-600 border-purple-500/20"
        >
          {type}
        </Badge>
      );
    case "crud":
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/10 text-amber-600 border-amber-500/20"
        >
          {type}
        </Badge>
      );
    case "form":
      return (
        <Badge
          variant="outline"
          className="bg-pink-500/10 text-pink-600 border-pink-500/20"
        >
          {type}
        </Badge>
      );
    case "report":
      return (
        <Badge
          variant="outline"
          className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
        >
          {type}
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}
