import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "../stores/auth-store";
import { ApiError } from "../services/api-client";
import type { AuthSession } from "../services/auth.service";

// Shared submit lifecycle for LoginForm/RegisterForm — both wrap their own authService call in
// the identical try/catch/finally + toast + setSession + router.push pattern, which used to be
// duplicated verbatim between the two components.
export function useAuthSubmit(successMessage: string) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(action: () => Promise<AuthSession>): Promise<void> {
    setError(null);
    setIsSubmitting(true);
    try {
      const session = await action();
      setSession(session);
      toast.success(successMessage);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { error, isSubmitting, submit };
}
