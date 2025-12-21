import type {
  CitySuggestion,
  Coordinates,
  GeoResolutionResult
} from "./geoTypes";
import { inferTimezone } from "./timezoneLookup";

// 动态导入 cities.json（如果可用）
let citiesData: Array<{
  name: string;
  lat: string;
  lng: string;
  country: string;
  admin1?: string;
  admin2?: string;
}> | null = null;

// 延迟加载 cities.json（避免在模块加载时阻塞）
function loadCitiesData() {
  if (citiesData !== null) {
    return citiesData; // 已经加载过
  }
  
  try {
    // 在 Node.js 环境中使用 require
    if (typeof require !== "undefined") {
      citiesData = require("cities.json");
      return citiesData;
    }
  } catch (e) {
    // 如果加载失败，使用内置的城市数据
    console.warn("cities.json not available, using built-in city database:", e);
    citiesData = []; // 设置为空数组，避免重复尝试
  }
  
  return citiesData;
}

/**
 * 抽象地理客户端接口，便于未来切换 Google Places/Mapbox 等实现。
 */
export interface GeoClient {
  searchCity(query: string): Promise<CitySuggestion[]>;
  resolveCoordinates(cityId: string): Promise<GeoResolutionResult>;
}

/**
 * 全球主要城市数据（包含经纬度和时区信息）
 */
interface CityData {
  suggestion: CitySuggestion;
  coordinates: Coordinates;
  timezone: string; // IANA 时区标识符
  isApproximate: boolean;
}

/**
 * 一个内存中的假实现，用于本地开发和单测。
 * 支持全球主要城市，包含时区信息。
 */
export class InMemoryGeoClient implements GeoClient {
  private cities: Record<string, CityData>;

  constructor() {
    // 全球主要城市数据（按地区分组）
    this.cities = {
      // 中国主要城市
      beijing: {
        suggestion: {
          id: "beijing",
          name: "北京市",
          countryCode: "CN",
          provinceName: "北京"
        },
        coordinates: { latitude: 39.9042, longitude: 116.4074 },
        timezone: "Asia/Shanghai",
        isApproximate: false
      },
      shanghai: {
        suggestion: {
          id: "shanghai",
          name: "上海市",
          countryCode: "CN",
          provinceName: "上海"
        },
        coordinates: { latitude: 31.2304, longitude: 121.4737 },
        timezone: "Asia/Shanghai",
        isApproximate: false
      },
      guangzhou: {
        suggestion: {
          id: "guangzhou",
          name: "广州市",
          countryCode: "CN",
          provinceName: "广东"
        },
        coordinates: { latitude: 23.1291, longitude: 113.2644 },
        timezone: "Asia/Shanghai",
        isApproximate: false
      },
      shenzhen: {
        suggestion: {
          id: "shenzhen",
          name: "深圳市",
          countryCode: "CN",
          provinceName: "广东"
        },
        coordinates: { latitude: 22.5431, longitude: 114.0579 },
        timezone: "Asia/Shanghai",
        isApproximate: false
      },
      hongkong: {
        suggestion: {
          id: "hongkong",
          name: "香港",
          countryCode: "HK"
        },
        coordinates: { latitude: 22.3193, longitude: 114.1694 },
        timezone: "Asia/Hong_Kong",
        isApproximate: false
      },
      taipei: {
        suggestion: {
          id: "taipei",
          name: "台北市",
          countryCode: "TW"
        },
        coordinates: { latitude: 25.0330, longitude: 121.5654 },
        timezone: "Asia/Taipei",
        isApproximate: false
      },
      // 美国主要城市
      "new-york": {
        suggestion: {
          id: "new-york",
          name: "New York",
          countryCode: "US",
          provinceName: "New York"
        },
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        timezone: "America/New_York",
        isApproximate: false
      },
      "los-angeles": {
        suggestion: {
          id: "los-angeles",
          name: "Los Angeles",
          countryCode: "US",
          provinceName: "California"
        },
        coordinates: { latitude: 34.0522, longitude: -118.2437 },
        timezone: "America/Los_Angeles",
        isApproximate: false
      },
      chicago: {
        suggestion: {
          id: "chicago",
          name: "Chicago",
          countryCode: "US",
          provinceName: "Illinois"
        },
        coordinates: { latitude: 41.8781, longitude: -87.6298 },
        timezone: "America/Chicago",
        isApproximate: false
      },
      // 欧洲主要城市
      london: {
        suggestion: {
          id: "london",
          name: "London",
          countryCode: "GB"
        },
        coordinates: { latitude: 51.5074, longitude: -0.1278 },
        timezone: "Europe/London",
        isApproximate: false
      },
      paris: {
        suggestion: {
          id: "paris",
          name: "Paris",
          countryCode: "FR"
        },
        coordinates: { latitude: 48.8566, longitude: 2.3522 },
        timezone: "Europe/Paris",
        isApproximate: false
      },
      berlin: {
        suggestion: {
          id: "berlin",
          name: "Berlin",
          countryCode: "DE"
        },
        coordinates: { latitude: 52.5200, longitude: 13.4050 },
        timezone: "Europe/Berlin",
        isApproximate: false
      },
      rome: {
        suggestion: {
          id: "rome",
          name: "Rome",
          countryCode: "IT"
        },
        coordinates: { latitude: 41.9028, longitude: 12.4964 },
        timezone: "Europe/Rome",
        isApproximate: false
      },
      moscow: {
        suggestion: {
          id: "moscow",
          name: "Moscow",
          countryCode: "RU"
        },
        coordinates: { latitude: 55.7558, longitude: 37.6173 },
        timezone: "Europe/Moscow",
        isApproximate: false
      },
      // 亚洲其他主要城市
      tokyo: {
        suggestion: {
          id: "tokyo",
          name: "Tokyo",
          countryCode: "JP"
        },
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        timezone: "Asia/Tokyo",
        isApproximate: false
      },
      seoul: {
        suggestion: {
          id: "seoul",
          name: "Seoul",
          countryCode: "KR"
        },
        coordinates: { latitude: 37.5665, longitude: 126.9780 },
        timezone: "Asia/Seoul",
        isApproximate: false
      },
      singapore: {
        suggestion: {
          id: "singapore",
          name: "Singapore",
          countryCode: "SG"
        },
        coordinates: { latitude: 1.3521, longitude: 103.8198 },
        timezone: "Asia/Singapore",
        isApproximate: false
      },
      bangkok: {
        suggestion: {
          id: "bangkok",
          name: "Bangkok",
          countryCode: "TH"
        },
        coordinates: { latitude: 13.7563, longitude: 100.5018 },
        timezone: "Asia/Bangkok",
        isApproximate: false
      },
      mumbai: {
        suggestion: {
          id: "mumbai",
          name: "Mumbai",
          countryCode: "IN"
        },
        coordinates: { latitude: 19.0760, longitude: 72.8777 },
        timezone: "Asia/Kolkata",
        isApproximate: false
      },
      delhi: {
        suggestion: {
          id: "delhi",
          name: "Delhi",
          countryCode: "IN"
        },
        coordinates: { latitude: 28.6139, longitude: 77.2090 },
        timezone: "Asia/Kolkata",
        isApproximate: false
      },
      // 大洋洲
      sydney: {
        suggestion: {
          id: "sydney",
          name: "Sydney",
          countryCode: "AU"
        },
        coordinates: { latitude: -33.8688, longitude: 151.2093 },
        timezone: "Australia/Sydney",
        isApproximate: false
      },
      melbourne: {
        suggestion: {
          id: "melbourne",
          name: "Melbourne",
          countryCode: "AU"
        },
        coordinates: { latitude: -37.8136, longitude: 144.9631 },
        timezone: "Australia/Melbourne",
        isApproximate: false
      },
      auckland: {
        suggestion: {
          id: "auckland",
          name: "Auckland",
          countryCode: "NZ"
        },
        coordinates: { latitude: -36.8485, longitude: 174.7633 },
        timezone: "Pacific/Auckland",
        isApproximate: false
      },
      // 南美洲
      "sao-paulo": {
        suggestion: {
          id: "sao-paulo",
          name: "São Paulo",
          countryCode: "BR"
        },
        coordinates: { latitude: -23.5505, longitude: -46.6333 },
        timezone: "America/Sao_Paulo",
        isApproximate: false
      },
      buenosaires: {
        suggestion: {
          id: "buenosaires",
          name: "Buenos Aires",
          countryCode: "AR"
        },
        coordinates: { latitude: -34.6037, longitude: -58.3816 },
        timezone: "America/Argentina/Buenos_Aires",
        isApproximate: false
      },
      // 中东
      dubai: {
        suggestion: {
          id: "dubai",
          name: "Dubai",
          countryCode: "AE"
        },
        coordinates: { latitude: 25.2048, longitude: 55.2708 },
        timezone: "Asia/Dubai",
        isApproximate: false
      },
      telaviv: {
        suggestion: {
          id: "telaviv",
          name: "Tel Aviv",
          countryCode: "IL"
        },
        coordinates: { latitude: 32.0853, longitude: 34.7818 },
        timezone: "Asia/Jerusalem",
        isApproximate: false
      }
    };
  }

  async searchCity(query: string): Promise<CitySuggestion[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];
    
    const normalized = trimmedQuery.toLowerCase();
    const isChinese = /[\u4e00-\u9fa5]/.test(trimmedQuery);

    // 1. 先检查内置的主要城市数据库
    const cityNameMap: Record<string, string> = {
      // 中国城市
      "北京": "beijing", "北京市": "beijing", "beijing": "beijing", "peking": "beijing",
      "上海": "shanghai", "上海市": "shanghai", "shanghai": "shanghai",
      "广州": "guangzhou", "广州市": "guangzhou", "guangzhou": "guangzhou", "canton": "guangzhou",
      "深圳": "shenzhen", "深圳市": "shenzhen", "shenzhen": "shenzhen",
      "香港": "hongkong", "hongkong": "hongkong", "hong kong": "hongkong",
      "台北": "taipei", "台北市": "taipei", "taipei": "taipei", "taipei city": "taipei",
      // 美国城市
      "纽约": "new-york", "new york": "new-york", "new-york": "new-york", "nyc": "new-york",
      "洛杉矶": "los-angeles", "los angeles": "los-angeles", "los-angeles": "los-angeles", "la": "los-angeles",
      "芝加哥": "chicago", "chicago": "chicago",
      // 欧洲城市
      "伦敦": "london", "london": "london",
      "巴黎": "paris", "paris": "paris",
      "柏林": "berlin", "berlin": "berlin",
      "罗马": "rome", "rome": "rome", "roma": "rome",
      "莫斯科": "moscow", "moscow": "moscow",
      // 亚洲城市
      "东京": "tokyo", "tokyo": "tokyo",
      "首尔": "seoul", "seoul": "seoul",
      "新加坡": "singapore", "singapore": "singapore",
      "曼谷": "bangkok", "bangkok": "bangkok",
      "孟买": "mumbai", "mumbai": "mumbai", "bombay": "mumbai",
      "德里": "delhi", "delhi": "delhi", "新德里": "delhi", "new delhi": "delhi",
      // 大洋洲
      "悉尼": "sydney", "sydney": "sydney",
      "墨尔本": "melbourne", "melbourne": "melbourne",
      "奥克兰": "auckland", "auckland": "auckland",
      // 南美洲
      "圣保罗": "sao-paulo", "são paulo": "sao-paulo", "sao paulo": "sao-paulo", "sao-paulo": "sao-paulo",
      "布宜诺斯艾利斯": "buenosaires", "buenos aires": "buenosaires", "buenosaires": "buenosaires",
      // 中东
      "迪拜": "dubai", "dubai": "dubai",
      "特拉维夫": "telaviv", "tel aviv": "telaviv", "telaviv": "telaviv"
    };

    // 对于中文查询，也尝试原始查询（不转小写）
    const queryWithoutSuffix = normalized.replace(/市$/, "");
    const queryWithoutSuffixCN = isChinese ? trimmedQuery.replace(/市$/, "") : queryWithoutSuffix;
    
    const cityId = cityNameMap[trimmedQuery] || cityNameMap[normalized] || 
                   cityNameMap[queryWithoutSuffixCN] || cityNameMap[queryWithoutSuffix];
    
    if (cityId && this.cities[cityId]) {
      return [this.cities[cityId].suggestion];
    }

    // 2. 如果 cities.json 可用，从中搜索
    const loadedCitiesData = loadCitiesData();
    if (loadedCitiesData && loadedCitiesData.length > 0) {
      // 中文城市名称映射（补充常见中文城市名到英文名的映射）
      const chineseCityMap: Record<string, string> = {
        "合肥": "Hefei",
        "西雅图": "Seattle",
        "成都": "Chengdu",
        "重庆": "Chongqing",
        "杭州": "Hangzhou",
        "南京": "Nanjing",
        "武汉": "Wuhan",
        "西安": "Xi'an",
        "苏州": "Suzhou",
        "天津": "Tianjin",
        "青岛": "Qingdao",
        "大连": "Dalian",
        "厦门": "Xiamen",
        "福州": "Fuzhou",
        "济南": "Jinan",
        "郑州": "Zhengzhou",
        "长沙": "Changsha",
        "昆明": "Kunming",
        "南昌": "Nanchang",
        "石家庄": "Shijiazhuang",
        "太原": "Taiyuan",
        "哈尔滨": "Harbin",
        "长春": "Changchun",
        "沈阳": "Shenyang",
        "乌鲁木齐": "Urumqi",
        "兰州": "Lanzhou",
        "银川": "Yinchuan",
        "西宁": "Xining",
        "拉萨": "Lhasa",
      };

      // 如果查询是中文，先尝试映射到英文名
      let searchTerms: string[] = [];
      if (isChinese) {
        // 中文查询：尝试映射到英文名
        const englishName = chineseCityMap[trimmedQuery] || chineseCityMap[queryWithoutSuffixCN];
        if (englishName) {
          searchTerms.push(englishName.toLowerCase());
        } else {
          // 如果没有映射，尝试直接搜索（虽然 cities.json 中城市名是英文）
          // 这种情况下可能找不到，但至少尝试一下
          searchTerms.push(normalized, queryWithoutSuffix);
        }
      } else {
        // 英文查询
        searchTerms = [normalized, queryWithoutSuffix];
      }
      
      // 精确匹配优先
      const exactMatches = loadedCitiesData.filter((city) => {
        const cityNameLower = city.name.toLowerCase();
        return searchTerms.some(term => cityNameLower === term);
      });

      if (exactMatches.length > 0) {
        return exactMatches.slice(0, 10).map((city, idx) => ({
          id: `cities-${city.name}-${city.country}-${idx}`,
          name: city.name,
          countryCode: city.country,
        }));
      }

      // 模糊匹配
      const fuzzyMatches = loadedCitiesData
        .filter((city) => {
          const cityNameLower = city.name.toLowerCase();
          return searchTerms.some(term => 
            cityNameLower.includes(term) || term.includes(cityNameLower)
          );
        })
        .slice(0, 20); // 限制返回数量

      if (fuzzyMatches.length > 0) {
        return fuzzyMatches.map((city, idx) => ({
          id: `cities-${city.name}-${city.country}-${idx}`,
          name: city.name,
          countryCode: city.country,
        }));
      }
    }

    // 3. 回退到内置城市的模糊匹配
    return Object.values(this.cities)
      .map((entry) => entry.suggestion)
      .filter((s) => {
        const cityNameLower = s.name.toLowerCase();
        const queryLower = query.trim().toLowerCase();
        const queryWithoutSuffixLower = queryLower.replace(/市$/, "");
        
        return (
          cityNameLower.includes(queryLower) ||
          cityNameLower.includes(queryWithoutSuffixLower) ||
          s.name.includes(query.trim()) ||
          s.name.includes(queryWithoutSuffixLower)
        );
      });
  }

  async resolveCoordinates(cityId: string): Promise<GeoResolutionResult> {
    // 1. 先检查内置城市数据库
    const entry = this.cities[cityId];
    if (entry) {
      return {
        coordinates: entry.coordinates,
        timezone: entry.timezone,
        isApproximate: entry.isApproximate
      };
    }

    // 2. 如果是来自 cities.json 的城市（ID 格式：cities-{name}-{country}-{idx}）
    const loadedCitiesData = loadCitiesData();
    if (cityId.startsWith("cities-") && loadedCitiesData) {
      const parts = cityId.split("-");
      if (parts.length >= 3) {
        const countryCode = parts[parts.length - 2]; // 倒数第二个是国家代码
        const cityName = parts.slice(1, -2).join("-"); // 中间部分是城市名
        
        const city = loadedCitiesData.find(
          (c) =>
            c.name === cityName &&
            c.country === countryCode
        );

        if (city) {
          const longitude = parseFloat(city.lng);
          const latitude = parseFloat(city.lat);
          
          // 推断时区
          const timezone = inferTimezone(city.country, longitude, latitude);

          return {
            coordinates: {
              latitude,
              longitude,
            },
            timezone,
            isApproximate: false,
          };
        }
      }
    }

    throw new Error("CITY_NOT_FOUND");
  }
}


