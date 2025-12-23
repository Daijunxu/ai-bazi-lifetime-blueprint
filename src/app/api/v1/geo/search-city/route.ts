/**
 * GET /api/v1/geo/search-city?q=城市名
 * 城市搜索 API，返回匹配的城市建议列表
 */

import { NextRequest, NextResponse } from "next/server";
import { InMemoryGeoClient } from "@/backend/geo/geoClient";

// 标记为动态路由，因为使用了 searchParams
export const dynamic = 'force-dynamic';

/**
 * 处理城市搜索请求
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200 }
      );
    }

    // Next.js 的 searchParams.get() 已经自动解码 URL 编码的参数
    // 但为了安全，确保正确处理
    query = decodeURIComponent(query.trim());

    // 使用 InMemoryGeoClient 搜索城市
    const geoClient = new InMemoryGeoClient();
    const suggestions = await geoClient.searchCity(query);

    return NextResponse.json(
      {
        success: true,
        data: suggestions.map((s) => ({
          id: s.id,
          name: s.name,
          displayName: s.displayName || s.name, // 使用层级显示名称，如果没有则使用城市名
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("城市搜索失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SEARCH_ERROR",
          message: error instanceof Error ? error.message : "搜索失败",
        },
      },
      { status: 500 }
    );
  }
}

