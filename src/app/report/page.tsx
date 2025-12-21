"use client";

/**
 * 报告展示页面
 * 显示完整的八字报告，包含 Sticky Header、Technical Card 和报告内容
 */

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// 顶部直接使用详细八字表，不再单独显示四柱 Header
import { FourPillarsTable } from "@/components/report/FourPillarsTable";
// 技术分析仍然在后台运行，但不在 UI 中展示 TechnicalCard
// import { TechnicalCard } from "@/components/report/TechnicalCard";
import { ReportContent } from "@/components/report/ReportContent";
import { getProfileById, type UserProfile } from "@/lib/storage/profileStorage";
import type { ChartJSON } from "@/types/bazi";
import type { AnalystVerdictJSON } from "@/types/analyst";
import type { BasicReport } from "@/types/report";
import { LoadingAnimation } from "@/components/LoadingAnimation";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const profileId = searchParams.get("profileId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [chart, setChart] = useState<ChartJSON | null>(null);
  const [verdict, setVerdict] = useState<AnalystVerdictJSON | null>(null);
  const [report, setReport] = useState<BasicReport | null>(null);

  useEffect(() => {
    if (!profileId) {
      setError("缺少 profileId 参数");
      setLoading(false);
      return;
    }

    // 从 localStorage 获取 profile
    const savedProfile = getProfileById(profileId);
    if (!savedProfile) {
      setError("未找到命盘记录");
      setLoading(false);
      return;
    }

    setProfile(savedProfile);

    // 调用 API 生成报告
    const fetchReport = async () => {
      try {
        const response = await fetch("/api/v1/report/init", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: savedProfile.name,
            gender: savedProfile.gender,
            birthDate: savedProfile.birthDate,
            birthCity: savedProfile.birthCity,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || "生成报告失败");
        }

        setChart(result.data.chart);
        setVerdict(result.data.verdict);
        setReport(result.data.report);
      } catch (err) {
        console.error("加载报告失败:", err);
        setError(err instanceof Error ? err.message : "加载报告失败");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [profileId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LoadingAnimation width={200} height={200} />
          <p
            style={{
              marginTop: "24px",
              fontSize: "18px",
              color: "#666",
              fontWeight: 500,
            }}
          >
            正在生成报告...
          </p>
        </div>
      </div>
    );
  }

  if (error || !chart || !verdict || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-2">加载失败</div>
          <p className="text-gray-600 mb-4">{error || "无法加载报告数据"}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 计算当前年龄（简化：基于出生日期）
  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = profile ? calculateAge(profile.birthDate) : 30;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* 主要内容（包含顶部八字表） */}
      <div
        style={{
          maxWidth: "768px",
          margin: "0 auto",
          padding: "16px",
          paddingTop: "20px",
          paddingBottom: "32px",
        }}
      >
        {/* 用户信息 */}
        {profile && (
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            {profile.name && (
              <h1
                style={{
                  fontSize: "clamp(20px, 5vw, 28px)",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                {profile.name} 的八字报告
              </h1>
            )}
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>
              <div>
                {new Date(profile.birthDate).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" · "}
                {new Date(profile.birthDate).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                {" · "}
                {profile.birthCity}
              </div>
            </div>
            {/* 更新按钮 */}
            <button
              onClick={() => router.push(`/?edit=${profileId}`)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                minHeight: "36px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#3b82f6";
              }}
            >
              更新
            </button>
          </div>
        )}

        {/* 顶部八字表（取代原来的四柱 Header，仅此一处展示命盘） */}
        <FourPillarsTable chart={chart} gender={profile?.gender} />

        {/* 报告内容 */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            padding: "clamp(16px, 4vw, 24px)",
          }}
        >
          <ReportContent content={report.content} />
        </div>

        {/* 返回按钮 */}
        <div style={{ marginTop: 32, textAlign: "center" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#e5e7eb",
              color: "#374151",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              minHeight: "44px", // 移动端触摸友好
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
            }}
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

