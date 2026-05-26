import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/pwa/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Horion",
    template: "%s · Horion",
  },
  description: "Plateforme communautaire de suivi musculation.",
  applicationName: "Horion",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
