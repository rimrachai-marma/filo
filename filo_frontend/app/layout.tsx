import type { Metadata } from "next";
import { DM_Sans, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontBody = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const fontDisplay = Syne({
  variable: "--font-display",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Filo",
  description: "Manage your files and folders securely",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable} antialiased`}>
        {children}
        {modal}
      </body>
    </html>
  );
}
