import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/shared/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = "https://doceditpro.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "DocEditPro — Privacy-First PDF & Document Toolkit",
    template: "%s | DocEditPro",
  },
  description:
    "44 powerful PDF tools that run 100% in your browser. Merge, split, compress, convert, OCR, encrypt — no file ever leaves your device. No sign-up, no watermarks, no paywalls.",
  keywords: [
    "PDF editor", "merge PDF", "compress PDF", "split PDF", "PDF to Word",
    "Word to PDF", "OCR PDF", "encrypt PDF", "online PDF tools", "privacy PDF",
    "client-side PDF", "free PDF tools", "DocEditPro",
  ],
  authors: [{ name: "DocEditPro" }],
  creator: "DocEditPro",
  publisher: "DocEditPro",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "DocEditPro",
    title: "DocEditPro — Privacy-First PDF & Document Toolkit",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <main id="main-content" className="flex-1 flex flex-col">
          {children}
        </main>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
