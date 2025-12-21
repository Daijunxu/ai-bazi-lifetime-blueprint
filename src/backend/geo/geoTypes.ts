/**
 * 地理位置与城市搜索相关的类型。
 * 仅抽象出与第三方地图/地理 API 的互动数据结构。
 */

export interface CitySuggestion {
  id: string; // 内部或第三方 placeId
  name: string; // 展示名称，例如「上海市」
  countryCode: string; // ISO 国家码，例如 CN
  // 可选：行政层级信息，方便未来做更精细展示
  provinceName?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoResolutionResult {
  coordinates: Coordinates;
  /**
   * 时区标识符（IANA 时区，例如 "Asia/Shanghai", "America/New_York"）
   */
  timezone?: string;
  /**
   * 如果是通过模糊匹配/用户自定义，经度精度不足，可在此标记
   */
  isApproximate: boolean;
}


