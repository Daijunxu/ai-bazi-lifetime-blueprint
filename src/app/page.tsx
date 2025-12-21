"use client";

/**
 * 主页面：Onboarding 表单
 * 用户输入出生信息，生成八字报告
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BirthForm, type BirthFormData } from "@/components/forms/BirthForm";
import { ProfileHistory } from "@/components/ProfileHistory";
import { saveProfile, getProfileById, updateProfile, type UserProfile } from "@/lib/storage/profileStorage";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProfileId = searchParams.get("edit");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile | null>(null);

  // 检查是否是编辑模式
  useEffect(() => {
    if (editProfileId) {
      const profile = getProfileById(editProfileId);
      if (profile) {
        setIsEditMode(true);
        setEditProfile(profile);
      } else {
        // 如果找不到 profile，清除编辑模式
        router.replace("/");
      }
    }
  }, [editProfileId, router]);

  const handleSubmit = async (formData: BirthFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // 组合日期和时间为本地时间字符串（不带时区信息）
      // 例如：1989-03-16T08:00:00（表示本地时区的 8:00）
      const localDateTime = `${formData.birthDate}T${formData.birthTime}:00`;

      // 准备 API 请求数据
      const requestData = {
        name: formData.name,
        gender: formData.gender,
        birthDate: localDateTime, // 直接发送本地时间字符串
        birthCity: formData.birthCity,
      };

      // 调用 API
      const response = await fetch("/api/v1/report/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "生成报告失败");
      }

      // 保存到 localStorage（使用本地时间字符串）
      let profile: UserProfile;
      if (isEditMode && editProfile) {
        // 更新现有 profile
        profile = updateProfile(editProfile.id, {
          name: formData.name,
          gender: formData.gender,
          birthDate: localDateTime,
          birthCity: formData.birthCity,
        });
      } else {
        // 创建新 profile
        profile = saveProfile({
          name: formData.name,
          gender: formData.gender,
          birthDate: localDateTime,
          birthCity: formData.birthCity,
        });
      }

      // 跳转到报告页面（使用 profile ID 作为查询参数）
      router.push(`/report?profileId=${profile.id}`);
    } catch (err) {
      console.error("提交失败:", err);
      setError(err instanceof Error ? err.message : "生成报告失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProfile = async (profile: UserProfile) => {
    setIsLoading(true);
    setError(null);

    try {
      // 准备 API 请求数据
      const requestData = {
        name: profile.name,
        gender: profile.gender,
        birthDate: profile.birthDate,
        birthCity: profile.birthCity,
      };

      // 调用 API
      const response = await fetch("/api/v1/report/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "生成报告失败");
      }

      // 跳转到报告页面
      router.push(`/report?profileId=${profile.id}`);
    } catch (err) {
      console.error("加载历史记录失败:", err);
      setError(err instanceof Error ? err.message : "加载报告失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e8f4f8 0%, #f5e8e8 25%, #f0f0f5 50%, #e8f0f8 75%, #f5f0e8 100%)",
        padding: "20px 16px",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* 标题框 - 渐变背景 */}
        <div
          style={{
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "clamp(20px, 5vw, 32px) clamp(16px, 4vw, 24px)",
            // 渐变背景
            background: "linear-gradient(135deg, rgba(232, 244, 248, 0.9) 0%, rgba(245, 232, 232, 0.9) 25%, rgba(240, 240, 245, 0.9) 50%, rgba(232, 240, 248, 0.9) 75%, rgba(245, 240, 232, 0.9) 100%)",
          }}
        >
          {/* 标题内容 */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(24px, 5vw, 32px)",
                fontWeight: 700,
                color: "#2d3748",
                marginBottom: "8px",
                textShadow: "0 1px 2px rgba(255, 255, 255, 0.8)",
              }}
            >
              {isEditMode ? "更新出生信息" : "AI 八字终身蓝图"}
            </h1>
            <p
              style={{
                fontSize: "clamp(14px, 3vw, 16px)",
                color: "#4a5568",
                textShadow: "0 1px 2px rgba(255, 255, 255, 0.8)",
              }}
            >
              {isEditMode
                ? "修改出生日期、时间和地点，重新生成八字报告"
                : "基于传统命理学与 AI 技术的个性化命盘分析"}
            </p>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              color: "#c33",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* 表单 */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            padding: "24px",
            backdropFilter: "blur(10px)",
            marginBottom: "16px",
          }}
        >
          <BirthForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            initialData={
              isEditMode && editProfile
                ? {
                    name: editProfile.name || "",
                    gender: editProfile.gender,
                    birthDate: editProfile.birthDate.split("T")[0], // 提取日期部分 YYYY-MM-DD
                    birthTime: (() => {
                      // 从 ISO 字符串中提取时间部分 HH:mm
                      const timePart = editProfile.birthDate.split("T")[1];
                      if (timePart) {
                        return timePart.substring(0, 5); // 提取 HH:mm
                      }
                      // 如果格式不对，尝试从 Date 对象转换
                      const date = new Date(editProfile.birthDate);
                      const hours = String(date.getUTCHours()).padStart(2, "0");
                      const minutes = String(date.getUTCMinutes()).padStart(2, "0");
                      return `${hours}:${minutes}`;
                    })(),
                    birthCity: editProfile.birthCity || "",
                  }
                : undefined
            }
          />
        </div>

        {/* 历史记录选择器 - 放在单独的框里 */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            padding: "24px",
            backdropFilter: "blur(10px)",
          }}
        >
          <ProfileHistory onSelectProfile={handleSelectProfile} />
        </div>

        {/* 说明 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>您的数据仅存储在本地浏览器中，不会上传到服务器</p>
        </div>
      </div>
    </div>
  );
}
