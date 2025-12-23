/**
 * Profile 存储模块
 * 使用 localStorage 保存最近 5 个用户命盘记录
 */

import type { ChartJSON } from "@/types/bazi";
import type { AnalystVerdictJSON } from "@/types/analyst";
import type { BasicReport } from "@/types/report";

export interface UserProfile {
  id: string; // 唯一标识符
  name?: string;
  gender: "male" | "female";
  birthDate: string; // ISO 8601 格式
  birthCity: string;
  createdAt: string; // ISO 8601 格式
  updatedAt: string; // ISO 8601 格式
  // 保存的报告数据（可选）
  reportData?: {
    chart: ChartJSON;
    verdict: AnalystVerdictJSON;
    report: BasicReport;
    generatedAt: string; // ISO 8601 格式
  };
}

const STORAGE_KEY = "bazi_profiles";
const MAX_PROFILES = 5;

/**
 * 获取所有保存的 profiles
 */
export function getProfiles(): UserProfile[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as UserProfile[];
  } catch (error) {
    console.error("读取 profiles 失败:", error);
    return [];
  }
}

/**
 * 保存 profile
 * 如果超过最大数量，删除最旧的
 */
export function saveProfile(profile: Omit<UserProfile, "id" | "createdAt" | "updatedAt">): UserProfile {
  if (typeof window === "undefined") {
    throw new Error("localStorage 仅在浏览器环境中可用");
  }

  const now = new Date().toISOString();
  const newProfile: UserProfile = {
    ...profile,
    id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };

  const profiles = getProfiles();

  // 检查是否已存在相同 profile（基于关键字段）
  const existingIndex = profiles.findIndex(
    (p) =>
      p.gender === profile.gender &&
      p.birthDate === profile.birthDate &&
      p.birthCity === profile.birthCity
  );

  if (existingIndex >= 0) {
    // 更新已存在的 profile
    const existingProfile = profiles[existingIndex];
    if (!existingProfile) {
      throw new Error("Existing profile not found");
    }
    profiles[existingIndex] = {
      ...existingProfile,
      ...newProfile,
      id: existingProfile.id, // 保留原 ID
      createdAt: existingProfile.createdAt, // 保留创建时间
      updatedAt: now,
    };
  } else {
    // 添加新 profile
    profiles.unshift(newProfile); // 最新的在前面

    // 如果超过最大数量，删除最旧的
    if (profiles.length > MAX_PROFILES) {
      profiles.splice(MAX_PROFILES);
    }
  }

  // 按更新时间排序（最新的在前）
  profiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("保存 profile 失败:", error);
    throw new Error("保存失败，可能是存储空间不足");
  }

  if (existingIndex >= 0) {
    const updatedProfile = profiles[existingIndex];
    if (!updatedProfile) {
      throw new Error("Updated profile not found");
    }
    return updatedProfile;
  }
  return newProfile;
}

/**
 * 根据 ID 获取 profile
 */
export function getProfileById(id: string): UserProfile | null {
  const profiles = getProfiles();
  return profiles.find((p) => p.id === id) || null;
}

/**
 * 保存报告数据到 profile
 */
export function saveReportData(
  profileId: string,
  chart: ChartJSON,
  verdict: AnalystVerdictJSON,
  report: BasicReport
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const profiles = getProfiles();
  const index = profiles.findIndex((p) => p.id === profileId);

  if (index === -1) {
    return false;
  }

  const existingProfile = profiles[index];
  if (!existingProfile) {
    return false;
  }

  const updatedProfile: UserProfile = {
    ...existingProfile,
    reportData: {
      chart,
      verdict,
      report,
      generatedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  profiles[index] = updatedProfile;

  // 按更新时间排序（最新的在前）
  profiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    return true;
  } catch (error) {
    console.error("保存报告数据失败:", error);
    return false;
  }
}

/**
 * 更新 profile
 */
export function updateProfile(
  id: string,
  updates: Partial<Omit<UserProfile, "id" | "createdAt" | "updatedAt">>
): UserProfile {
  if (typeof window === "undefined") {
    throw new Error("localStorage 仅在浏览器环境中可用");
  }

  const profiles = getProfiles();
  const index = profiles.findIndex((p) => p.id === id);

  if (index === -1) {
    throw new Error(`Profile with id ${id} not found`);
  }

  const existingProfile = profiles[index];
  if (!existingProfile) {
    throw new Error(`Profile with id ${id} not found`);
  }

  // 如果更新了出生信息（birthDate, birthCity, gender），清除旧的报告数据
  const hasBirthInfoChanged = 
    (updates.birthDate !== undefined && updates.birthDate !== existingProfile.birthDate) ||
    (updates.birthCity !== undefined && updates.birthCity !== existingProfile.birthCity) ||
    (updates.gender !== undefined && updates.gender !== existingProfile.gender);

  const updatedProfile: UserProfile = {
    ...existingProfile,
    ...updates,
    id: existingProfile.id, // 保留原 ID
    createdAt: existingProfile.createdAt, // 保留创建时间
    updatedAt: new Date().toISOString(),
    // 如果出生信息改变，清除报告数据
    reportData: hasBirthInfoChanged ? undefined : existingProfile.reportData,
  };

  profiles[index] = updatedProfile;

  // 按更新时间排序（最新的在前）
  profiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error("更新 profile 失败:", error);
    throw new Error("更新失败，可能是存储空间不足");
  }

  return updatedProfile;
}

/**
 * 删除 profile
 */
export function deleteProfile(id: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const profiles = getProfiles();
  const filtered = profiles.filter((p) => p.id !== id);

  if (filtered.length === profiles.length) {
    return false; // 未找到
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("删除 profile 失败:", error);
    return false;
  }
}

/**
 * 清空所有 profiles
 */
export function clearProfiles(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("清空 profiles 失败:", error);
  }
}

