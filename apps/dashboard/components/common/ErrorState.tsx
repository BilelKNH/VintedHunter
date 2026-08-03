import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

export interface ErrorStateProps {
  message?: string;
  onRetry?(): void;
}

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/5 py-16 text-center">
      <AlertTriangle className="h-5 w-5 text-danger" />
      <p className="text-sm text-text-secondary">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
