import { Sparkles } from "lucide-react";
import { Badge } from "../ui/badge";

export function AnalysisPendingBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-dashed">
      <Sparkles className="h-3 w-3" />
      Not yet scored &mdash; Phase 5
    </Badge>
  );
}
