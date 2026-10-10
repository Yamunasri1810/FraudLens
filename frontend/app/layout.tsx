import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "FraudLens — AI Credit Card Fraud Detection Platform",
  description: "AI-Powered credit card fraud triage and investigation decision-support platform for financial institutions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100 dark">
      <body className="min-h-full flex bg-[#080d1a] antialiased">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
