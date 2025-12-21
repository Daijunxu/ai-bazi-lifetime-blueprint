"use client";

/**
 * Profile 历史选择器组件
 * 按钮样式的下拉表单，显示最近保存的命盘
 */

import { useState, useEffect, useRef } from "react";
import { getProfiles, type UserProfile } from "@/lib/storage/profileStorage";

interface ProfileHistoryProps {
  onSelectProfile: (profile: UserProfile) => void;
  currentProfileId?: string;
}

export function ProfileHistory({
  onSelectProfile,
  currentProfileId,
}: ProfileHistoryProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfiles(getProfiles());
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (profiles.length === 0) {
    return null;
  }

  // 格式化日期（只显示年月日，不包含时间）
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 获取显示名称（名字或默认名称）
  const getDisplayName = (profile: UserProfile) => {
    if (profile.name && profile.name.trim()) {
      return profile.name;
    }
    return "未命名";
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "14px 24px",
          backgroundColor: "#87CEEB",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#6bb6d6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#87CEEB";
        }}
      >
        <span>历史记录</span>
        <span style={{ fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "8px",
            backgroundColor: "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {profiles.map((profile, index) => (
              <li
                key={profile.id}
                onClick={() => {
                  onSelectProfile(profile);
                  setIsOpen(false);
                }}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom: index < profiles.length - 1 ? "1px solid #f0f0f0" : "none",
                  backgroundColor: currentProfileId === profile.id ? "#f0f8ff" : "#ffffff",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (currentProfileId !== profile.id) {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentProfileId !== profile.id) {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }
                }}
              >
                <div
                  style={{
                    fontSize: "15px",
                    color: "#333",
                    fontWeight: 500,
                  }}
                >
                  {getDisplayName(profile)}：{formatDate(profile.birthDate)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
