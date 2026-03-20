import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foal AI — AI 창업 멘토",
  description: "예비창업자의 아이디어를 질문으로 검증하고, 창업자의 생각을 사업계획서 언어로 번역해주는 AI 창업 멘토",
  keywords: ["창업", "사업계획서", "AI", "스타트업", "예비창업", "예비창업패키지", "JTBD"],
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
