import type { ReactNode } from "react";

export const metadata = {
  title: "Vinted Opportunity Hunter AI",
  description: "AI-powered resale opportunity detection dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
