import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ApolloProviderWrapper } from "@/providers/apollo-provider";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Filterie - 情報濾過ハブ",
  description: "一次情報に素早くアクセスし、AIフィルタリングを通じて価値ある情報のみを抽出",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApolloProviderWrapper>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ApolloProviderWrapper>
      </body>
    </html>
  );
}
