import "./globals.css";
import { AuthProvider } from "./lib/auth-context";
import { SiteHeader } from "./components/site-header";

export const metadata = { title: "ISHARA", description: "Algerian Sign Language recognition" };

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
