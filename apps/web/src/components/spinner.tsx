import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: number;
}

export default function Spinner({ className, size = 16 }: SpinnerProps) {
  return <Loader2 className={cn("animate-spin text-muted-foreground", className)} style={{ width: size, height: size }} />;
}
