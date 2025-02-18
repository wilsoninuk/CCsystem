import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "商业管理系统",
  description: "基于 Next.js 14 开发的现代化商业管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={geist.className} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
