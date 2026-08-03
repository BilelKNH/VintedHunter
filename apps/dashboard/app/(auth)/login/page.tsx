import { LoginForm } from "../../../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-text-primary">Sign in</h1>
      <LoginForm />
    </div>
  );
}
