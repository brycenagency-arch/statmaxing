import type { Metadata } from "next";
import { Inter, Anton } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitQuest",
  description: "Level up your fitness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${anton.variable} h-full antialiased bg-[#0A0118]`}
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-[#00D9FF]/30 bg-[#0A0118] text-[#ededed]">
        <Navbar />
        <main className="flex-1 flex flex-col pb-32 md:pb-8 md:pt-28">
          {children}
        </main>
      </body>
    </html>
  );
}
