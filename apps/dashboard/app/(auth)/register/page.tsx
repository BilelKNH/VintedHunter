import { RegisterForm } from "../../../components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-text-primary">Create an account</h1>
      <RegisterForm />
    </div>
  );
}
