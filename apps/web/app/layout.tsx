import "./globals.css";
import { AuthProvider } from "./lib/auth-context";
import { SiteHeader } from "./components/site-header";

export const metadata = {
  title: { default: "ISHARA — Algerian Sign Language", template: "%s · ISHARA" },
  description: "A calm workspace for learning and building Algerian Sign Language communication tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SiteHeader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
