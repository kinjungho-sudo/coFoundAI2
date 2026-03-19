import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoFound AI — AI 공동창업자",
  description: "예비창업자의 아이디어를 AI 질문으로 검증하고 사업계획서로 번역합니다.",
  keywords: ["창업", "사업계획서", "AI", "스타트업", "예비창업"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <body>{children}</body>
    </html>
  );
}
