import React from "react";

export const metadata = {
  title: "AI 八字终身蓝图",
  description: "基于真太阳时与多智能体架构的 AI 八字终身报告平台"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}


