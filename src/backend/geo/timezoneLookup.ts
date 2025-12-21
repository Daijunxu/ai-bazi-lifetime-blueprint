/**
 * 时区查找工具
 * 根据国家代码和经纬度推断 IANA 时区标识符
 */

/**
 * 国家代码到时区的映射（简化版本，覆盖主要国家）
 */
const COUNTRY_TIMEZONE_MAP: Record<string, string[]> = {
  CN: ["Asia/Shanghai"],
  HK: ["Asia/Hong_Kong"],
  TW: ["Asia/Taipei"],
  JP: ["Asia/Tokyo"],
  KR: ["Asia/Seoul"],
  SG: ["Asia/Singapore"],
  TH: ["Asia/Bangkok"],
  IN: ["Asia/Kolkata"],
  AU: ["Australia/Sydney", "Australia/Melbourne", "Australia/Adelaide", "Australia/Darwin", "Australia/Perth", "Australia/Brisbane"],
  NZ: ["Pacific/Auckland"],
  US: ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "America/Anchorage", "Pacific/Honolulu"],
  CA: ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg", "America/Halifax"],
  GB: ["Europe/London"],
  FR: ["Europe/Paris"],
  DE: ["Europe/Berlin"],
  IT: ["Europe/Rome"],
  ES: ["Europe/Madrid"],
  RU: ["Europe/Moscow"],
  BR: ["America/Sao_Paulo", "America/Manaus", "America/Fortaleza"],
  AR: ["America/Argentina/Buenos_Aires"],
  AE: ["Asia/Dubai"],
  IL: ["Asia/Jerusalem"],
  MX: ["America/Mexico_City"],
};

/**
 * 根据经纬度推断美国时区
 */
function getUSTimezone(longitude: number): string {
  // 注意：经度是负数，从东到西递减
  // 先检查最西边的（经度最小）
  if (longitude < -127.5) {
    return "America/Anchorage"; // 阿拉斯加
  } else if (longitude >= -127.5 && longitude < -112.5) {
    return "America/Los_Angeles"; // 太平洋时区（包括西雅图 -122.33）
  } else if (longitude >= -112.5 && longitude < -97.5) {
    return "America/Denver"; // 山地时区
  } else if (longitude >= -97.5 && longitude < -82.5) {
    return "America/Chicago"; // 中部时区
  } else if (longitude >= -82.5 && longitude < -67.5) {
    return "America/New_York"; // 东部时区
  }
  return "America/New_York"; // 默认
}

/**
 * 根据经纬度推断中国时区（中国统一使用 UTC+8）
 */
function getChinaTimezone(longitude: number): string {
  return "Asia/Shanghai";
}

/**
 * 根据经纬度推断澳大利亚时区
 */
function getAustraliaTimezone(longitude: number): string {
  if (longitude >= 113 && longitude < 130) {
    return "Australia/Perth"; // 西部
  } else if (longitude >= 130 && longitude < 142) {
    return "Australia/Darwin"; // 北部
  } else if (longitude >= 142 && longitude < 150) {
    return "Australia/Brisbane"; // 昆士兰
  } else if (longitude >= 150 && longitude < 155) {
    return "Australia/Sydney"; // 新南威尔士、维多利亚、塔斯马尼亚
  } else {
    return "Australia/Adelaide"; // 南澳大利亚
  }
}

/**
 * 根据国家代码和经纬度推断时区
 */
export function inferTimezone(
  countryCode: string,
  longitude: number,
  latitude?: number
): string {
  const country = countryCode.toUpperCase();
  
  // 特殊处理大国家（需要根据经纬度细分）
  if (country === "US") {
    return getUSTimezone(longitude);
  } else if (country === "CN") {
    return getChinaTimezone(longitude);
  } else if (country === "AU") {
    return getAustraliaTimezone(longitude);
  } else if (country === "CA") {
    // 加拿大简化处理
    if (longitude < -85) {
      return "America/Toronto";
    } else if (longitude < -100) {
      return "America/Winnipeg";
    } else if (longitude < -115) {
      return "America/Edmonton";
    } else {
      return "America/Vancouver";
    }
  } else if (country === "BR") {
    // 巴西简化处理
    if (longitude < -45) {
      return "America/Sao_Paulo";
    } else if (longitude < -60) {
      return "America/Manaus";
    } else {
      return "America/Fortaleza";
    }
  }
  
  // 其他国家使用默认映射
  const timezones = COUNTRY_TIMEZONE_MAP[country];
  if (timezones && timezones.length > 0) {
    const timezone = timezones[0]; // 返回第一个时区（通常是主要时区）
    if (!timezone) {
      throw new Error(`Invalid timezone for country: ${country}`);
    }
    return timezone;
  }
  
  // 如果找不到，根据经度估算 UTC 偏移
  const utcOffset = Math.round(longitude / 15);
  // 返回一个通用的时区标识符（这不是最佳方案，但作为后备）
  return `Etc/GMT${utcOffset > 0 ? "-" : "+"}${Math.abs(utcOffset)}`;
}

