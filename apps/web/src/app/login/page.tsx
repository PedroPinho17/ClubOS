import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar — ClubOS",
  description: "Acede ao backoffice ou portal do sócio.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-x-hidden bg-muted/40 p-4">
      <LoginForm />
    </div>
  );
}
