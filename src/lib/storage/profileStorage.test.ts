/**
 * Profile 存储模块的单元测试
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getProfiles,
  saveProfile,
  getProfileById,
  deleteProfile,
  clearProfiles,
} from "./profileStorage";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe("profileStorage", () => {
  beforeEach(() => {
    // 在每个测试前清空 localStorage
    localStorageMock.clear();
    // Mock window.localStorage
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  it("应该能够保存和获取 profiles", () => {
    const profile = saveProfile({
      name: "测试用户",
      gender: "male",
      birthDate: "1990-01-15T14:30:00Z",
      birthCity: "北京",
    });

    expect(profile.id).toBeDefined();
    expect(profile.name).toBe("测试用户");
    expect(profile.gender).toBe("male");

    const profiles = getProfiles();
    expect(profiles.length).toBe(1);
    expect(profiles[0].id).toBe(profile.id);
  });

  it("应该限制最多保存 5 个 profiles", () => {
    // 保存 6 个 profiles
    for (let i = 0; i < 6; i++) {
      saveProfile({
        name: `用户${i}`,
        gender: "male",
        birthDate: `199${i}-01-15T14:30:00Z`,
        birthCity: "北京",
      });
    }

    const profiles = getProfiles();
    expect(profiles.length).toBe(5);
  });

  it("应该更新已存在的 profile（基于关键字段）", () => {
    const profile1 = saveProfile({
      name: "用户1",
      gender: "male",
      birthDate: "1990-01-15T14:30:00Z",
      birthCity: "北京",
    });

    const profile2 = saveProfile({
      name: "用户1更新",
      gender: "male",
      birthDate: "1990-01-15T14:30:00Z", // 相同
      birthCity: "北京", // 相同
    });

    expect(profile1.id).toBe(profile2.id); // 应该是同一个 ID
    expect(profile2.name).toBe("用户1更新");

    const profiles = getProfiles();
    expect(profiles.length).toBe(1);
  });

  it("应该根据 ID 获取 profile", () => {
    const saved = saveProfile({
      gender: "female",
      birthDate: "1995-06-20T10:00:00Z",
      birthCity: "上海",
    });

    const retrieved = getProfileById(saved.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(saved.id);
    expect(retrieved?.gender).toBe("female");
  });

  it("应该在找不到 profile 时返回 null", () => {
    const retrieved = getProfileById("不存在的ID");
    expect(retrieved).toBeNull();
  });

  it("应该能够删除 profile", () => {
    const profile = saveProfile({
      gender: "male",
      birthDate: "1990-01-15T14:30:00Z",
      birthCity: "北京",
    });

    const deleted = deleteProfile(profile.id);
    expect(deleted).toBe(true);

    const profiles = getProfiles();
    expect(profiles.length).toBe(0);
  });

  it("应该在删除不存在的 profile 时返回 false", () => {
    const deleted = deleteProfile("不存在的ID");
    expect(deleted).toBe(false);
  });

  it("应该能够清空所有 profiles", () => {
    saveProfile({
      gender: "male",
      birthDate: "1990-01-15T14:30:00Z",
      birthCity: "北京",
    });
    saveProfile({
      gender: "female",
      birthDate: "1995-06-20T10:00:00Z",
      birthCity: "上海",
    });

    clearProfiles();

    const profiles = getProfiles();
    expect(profiles.length).toBe(0);
  });

  it("应该按更新时间排序（最新的在前）", () => {
    const profile1 = saveProfile({
      gender: "male",
      birthDate: "1990-01-15T14:30:00Z",
      birthCity: "北京",
    });

    // 等待一小段时间确保时间戳不同
    vi.useFakeTimers();
    vi.advanceTimersByTime(1000);

    const profile2 = saveProfile({
      gender: "female",
      birthDate: "1995-06-20T10:00:00Z",
      birthCity: "上海",
    });

    const profiles = getProfiles();
    expect(profiles[0].id).toBe(profile2.id); // 最新的应该在前面
    expect(profiles[1].id).toBe(profile1.id);

    vi.useRealTimers();
  });
});

