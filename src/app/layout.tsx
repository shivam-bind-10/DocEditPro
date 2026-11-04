import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/shared/ServiceWorkerRegister";
import { SmoothScroll } from "@/components/shared/SmoothScroll";

const APP_URL = "https://doceditpro.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "DocEditPro — Privacy-First Client-Side Document Studio",
    template: "%s | DocEditPro",
  },
  description:
    "44 powerful PDF utilities running 100% locally in your browser with WebAssembly. Merge, split, compress, convert, OCR, encrypt — zero server uploads.",
  keywords: [
    "PDF editor", "merge PDF", "compress PDF", "split PDF", "PDF to Word",
    "Word to PDF", "OCR PDF", "encrypt PDF", "online PDF tools", "privacy PDF",
    "client-side PDF", "free PDF tools", "DocEditPro", "Vercel design",
  ],
  authors: [{ name: "DocEditPro" }],
  creator: "DocEditPro",
  publisher: "DocEditPro",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "DocEditPro",
    title: "DocEditPro — Privacy-First Document Studio",
    description:
      "44 powerful PDF tools. 100% client-side. No file ever leaves your browser.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocEditPro — Privacy-First PDF Toolkit",
    description: "44 PDF tools. Zero server uploads. No watermarks. Free.",
    creator: "@doceditpro",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600&family=Geist:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans antialiased"
        suppressHydrationWarning
      >
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <SmoothScroll>
          <div id="main-content" className="flex-1 flex flex-col">
            {children}
          </div>
        </SmoothScroll>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
