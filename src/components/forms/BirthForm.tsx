"use client";

/**
 * 出生信息表单组件
 * 包含：姓名（可选）、性别、出生日期、出生时间、出生城市（自动完成）
 */

import { useState, FormEvent, useRef, useEffect } from "react";
import type { UserProfile } from "@/lib/storage/profileStorage";
import { LoadingAnimation } from "@/components/LoadingAnimation";

export interface BirthFormData {
  name?: string;
  gender: "male" | "female";
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:mm
  birthCity: string;
}

interface BirthFormProps {
  onSubmit: (data: BirthFormData) => void | Promise<void>;
  initialData?: Partial<BirthFormData>;
  isLoading?: boolean;
}

export function BirthForm({ onSubmit, initialData, isLoading = false }: BirthFormProps) {
  const [formData, setFormData] = useState<BirthFormData>({
    name: initialData?.name || "",
    gender: initialData?.gender || "male",
    birthDate: initialData?.birthDate || "",
    birthTime: initialData?.birthTime || "",
    birthCity: initialData?.birthCity || "",
  });

  const [citySuggestions, setCitySuggestions] = useState<Array<{ id: string; name: string; displayName: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // 当 initialData 变化时，更新表单数据（用于编辑模式）
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name ?? "",
        gender: initialData.gender ?? "male",
        birthDate: initialData.birthDate ?? "",
        birthTime: initialData.birthTime ?? "",
        birthCity: initialData.birthCity ?? "",
      });
    }
  }, [initialData]);

  const searchCity = async (query: string) => {
    if (query.length === 0) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingCity(true);
    try {
      // 调用后端 API 搜索城市
      const response = await fetch(`/api/v1/geo/search-city?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setCitySuggestions(result.data);
        setShowSuggestions(result.data.length > 0);
      } else {
        setCitySuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("搜索城市失败:", error);
      setCitySuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearchingCity(false);
    }
  };

  const handleCityInput = (value: string) => {
    setFormData({ ...formData, birthCity: value });
    
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length > 0) {
      // 防抖：延迟 300ms 后搜索
      searchTimeoutRef.current = setTimeout(() => {
        searchCity(value);
      }, 300);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectCity = (city: { name: string }) => {
    // 使用完整的城市名称（后端支持带"市"的名称）
    setFormData((prev) => ({
      ...prev,
      birthCity: city.name,
    }));
    setCitySuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "100%", padding: "0" }}>
      {/* 姓名（可选） */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "16px 0",
          borderBottom: "1px solid #f0f0f0",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <label
          htmlFor="name"
          style={{
            flexShrink: 0,
            width: "80px",
            fontSize: "15px",
            color: "#333",
            marginRight: "12px",
            boxSizing: "border-box",
          }}
        >
          昵称
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: "100%",
            height: "44px",
            minHeight: "44px",
            padding: "10px 12px",
            backgroundColor: "#f5f5f5",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            outline: "none",
            boxSizing: "border-box",
          }}
          placeholder="请输入昵称 (1-6个字)"
        />
      </div>

      {/* 性别 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "16px 0",
          borderBottom: "1px solid #f0f0f0",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <label
          style={{
            flexShrink: 0,
            width: "80px",
            fontSize: "15px",
            color: "#333",
            marginRight: "12px",
            boxSizing: "border-box",
          }}
        >
          性别
        </label>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: "100%",
            display: "flex",
            gap: "12px",
            boxSizing: "border-box",
          }}
        >
          <button
            type="button"
            onClick={() => setFormData({ ...formData, gender: "female" })}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "10px 16px",
              backgroundColor: formData.gender === "female" ? "#FFB6C1" : "#ffffff",
              color: formData.gender === "female" ? "#ffffff" : "#666",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: formData.gender === "female" ? 500 : 400,
              cursor: "pointer",
              transition: "all 0.2s",
              boxSizing: "border-box",
            }}
          >
            ♀ 女生
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, gender: "male" })}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "10px 16px",
              backgroundColor: formData.gender === "male" ? "#87CEEB" : "#ffffff",
              color: formData.gender === "male" ? "#ffffff" : "#666",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: formData.gender === "male" ? 500 : 400,
              cursor: "pointer",
              transition: "all 0.2s",
              boxSizing: "border-box",
            }}
          >
            ♂ 男生
          </button>
        </div>
      </div>

      {/* 出生时间 */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          padding: "16px 0",
          borderBottom: "1px solid #f0f0f0",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <label
          htmlFor="birthTime"
          style={{
            flexShrink: 0,
            width: "80px",
            fontSize: "15px",
            color: "#333",
            marginRight: "12px",
            paddingTop: "10px",
            boxSizing: "border-box",
          }}
        >
          出生时间
        </label>
        <div
          style={{
            flex: 1,
            position: "relative",
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <input
            type="date"
            id="birthDate"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            required
            max={new Date().toISOString().split("T")[0]}
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "44px",
              minHeight: "44px",
              padding: "10px 12px",
              backgroundColor: "#f5f5f5",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              outline: "none",
              color: formData.birthDate ? "#333" : "#999",
              marginBottom: "8px",
              boxSizing: "border-box",
              WebkitAppearance: "none",
              appearance: "none",
            }}
          />
          <input
            type="time"
            id="birthTime"
            value={formData.birthTime}
            onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
            required
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "44px",
              minHeight: "44px",
              padding: "10px 12px",
              backgroundColor: "#f5f5f5",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              outline: "none",
              color: formData.birthTime ? "#333" : "#999",
              boxSizing: "border-box",
              WebkitAppearance: "none",
              appearance: "none",
            }}
          />
        </div>
      </div>

      {/* 出生城市（自动完成） */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "16px 0",
          borderBottom: "1px solid #f0f0f0",
          position: "relative",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <label
          htmlFor="birthCity"
          style={{
            flexShrink: 0,
            width: "80px",
            fontSize: "15px",
            color: "#333",
            marginRight: "12px",
            boxSizing: "border-box",
          }}
        >
          出生地点
        </label>
        <div
          style={{
            flex: 1,
            position: "relative",
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <input
            type="text"
            id="birthCity"
            value={formData.birthCity}
            onChange={(e) => handleCityInput(e.target.value)}
            onFocus={() => {
              if (citySuggestions.length > 0) {
                setShowSuggestions(true);
              } else if (formData.birthCity.length > 0) {
                // 如果有输入但还没有建议，触发搜索
                searchCity(formData.birthCity);
              }
            }}
            onBlur={(e) => {
              // 延迟隐藏，以便点击建议项
              setTimeout(() => {
                // 检查焦点是否移到了建议列表
                const activeElement = document.activeElement;
                if (!suggestionsRef.current?.contains(activeElement)) {
                  setShowSuggestions(false);
                }
              }, 200);
            }}
            required
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "44px",
              minHeight: "44px",
              padding: "10px 12px",
              backgroundColor: "#f5f5f5",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              outline: "none",
              color: formData.birthCity ? "#333" : "#999",
              boxSizing: "border-box",
            }}
            placeholder="请选择"
          />
          {showSuggestions && citySuggestions.length > 0 && (
            <ul
              ref={suggestionsRef}
              style={{
                position: "absolute",
                zIndex: 10,
                width: "100%",
                maxWidth: "100%",
                marginTop: "4px",
                backgroundColor: "#ffffff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                maxHeight: "240px",
                overflow: "auto",
                listStyle: "none",
                padding: 0,
                boxSizing: "border-box",
              }}
              onMouseDown={(e) => {
                // 阻止 onBlur 触发
                e.preventDefault();
              }}
            >
              {citySuggestions.map((city) => (
                <li
                  key={city.id}
                  onClick={() => handleSelectCity(city)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    fontSize: "15px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                >
                  {city.displayName || city.name}
                </li>
              ))}
            </ul>
          )}
          {isSearchingCity && (
            <div
              style={{
                position: "absolute",
                right: "32px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#999",
                fontSize: "12px",
              }}
            >
              搜索中...
            </div>
          )}
        </div>
      </div>

      {/* 提交按钮 */}
      <div style={{ marginTop: "32px", paddingBottom: "32px" }}>
        {isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <LoadingAnimation width={150} height={150} />
            <p
              style={{
                marginTop: "16px",
                fontSize: "16px",
                color: "#666",
                fontWeight: 500,
              }}
            >
              正在生成报告...
            </p>
          </div>
        )}
        <button
          type="submit"
          disabled={
            isLoading ||
            !formData.birthDate?.trim() ||
            !formData.birthTime?.trim() ||
            !formData.birthCity?.trim()
          }
          style={{
            width: "100%",
            padding: "14px 24px",
            backgroundColor: isLoading ||
              !formData.birthDate?.trim() ||
              !formData.birthTime?.trim() ||
              !formData.birthCity?.trim()
              ? "#cccccc"
              : "#87CEEB",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 500,
            cursor: isLoading ||
              !formData.birthDate?.trim() ||
              !formData.birthTime?.trim() ||
              !formData.birthCity?.trim()
              ? "not-allowed"
              : "pointer",
            outline: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (
              !isLoading &&
              formData.birthDate?.trim() &&
              formData.birthTime?.trim() &&
              formData.birthCity?.trim()
            ) {
              e.currentTarget.style.backgroundColor = "#6bb6d6";
            }
          }}
          onMouseLeave={(e) => {
            if (
              !isLoading &&
              formData.birthDate?.trim() &&
              formData.birthTime?.trim() &&
              formData.birthCity?.trim()
            ) {
              e.currentTarget.style.backgroundColor = "#87CEEB";
            }
          }}
        >
          {isLoading ? "生成报告中..." : "保存"}
        </button>
      </div>
    </form>
  );
}

