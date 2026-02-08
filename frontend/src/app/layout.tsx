import type { Metadata } from "next";
import { Noto_Sans_KR, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["korean", "latin"],
});

export const metadata: Metadata = {
  title: "Sahmyook Navigator",
  description: "Campus wayfinding experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${spaceGrotesk.variable} ${notoSansKr.variable}`}>
        {children}
      </body>
    </html>
  );
}
