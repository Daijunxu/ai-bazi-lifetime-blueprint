"use client";

/**
 * 报告内容组件
 * 渲染 Markdown 格式的报告内容
 * 在原有基础上增加顶部/底部的卡片式排版，更接近多媒体报告风格
 */

interface ReportContentProps {
  content: string;
}

/**
 * 将 Markdown 文本转换为 HTML（支持基本格式）
 */
function renderMarkdownInline(text: string): string {
  if (!text) return "";
  
  let html = text;
  
  // 使用占位符来保护已处理的 Markdown，避免被后续转义影响
  const placeholders: Record<string, string> = {};
  let placeholderIndex = 0;
  
  const createPlaceholder = (htmlContent: string): string => {
    // 使用特殊字符组合作为占位符，避免被任何 Markdown 正则匹配
    // 格式：\u0001MD\u0002数字\u0003（使用不可见控制字符）
    const key = `\u0001MD\u0002${placeholderIndex++}\u0003`;
    placeholders[key] = htmlContent;
    return key;
  };
  
  // 行内代码：`代码`（优先处理）
  html = html.replace(/`([^`\n]+)`/g, (match, code) => {
    return createPlaceholder(`<code style="background-color: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">${escapeHtml(code)}</code>`);
  });
  
  // 加粗：**文字**（优先于斜体处理）
  html = html.replace(/\*\*([^*\n]+?)\*\*/g, (match, content) => {
    return createPlaceholder(`<strong>${escapeHtml(content)}</strong>`);
  });
  
  // 加粗：__文字__（避免与斜体冲突）
  html = html.replace(/__([^_\n]+?)__/g, (match, content) => {
    // 如果包含占位符，说明已经被处理过，跳过
    if (match.includes('\u0001MD\u0002')) return match;
    return createPlaceholder(`<strong>${escapeHtml(content)}</strong>`);
  });
  
  // 删除线：~~文字~~
  html = html.replace(/~~([^~\n]+?)~~/g, (match, content) => {
    return createPlaceholder(`<del>${escapeHtml(content)}</del>`);
  });
  
  // 链接：[文字](URL)（在斜体之前处理）
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    return createPlaceholder(`<a href="${escapeHtml(url)}" style="color: #3b82f6; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`);
  });
  
  // 斜体：*文字*（在加粗之后处理，匹配单个星号）
  // 使用字符类来确保前后不是星号
  html = html.replace(/(^|[^*])\*([^*\n]+?)\*([^*]|$)/g, (match, before, content, after) => {
    // 如果包含占位符，跳过
    if (match.includes('\u0001MD\u0002')) return match;
    return before + createPlaceholder(`<em>${escapeHtml(content)}</em>`) + (after || '');
  });
  
  // 斜体：_文字_（在加粗之后处理，匹配单个下划线）
  html = html.replace(/(^|[^_])_([^_\n]+?)_([^_]|$)/g, (match, before, content, after) => {
    // 如果包含占位符，跳过
    if (match.includes('\u0001MD\u0002')) return match;
    return before + createPlaceholder(`<em>${escapeHtml(content)}</em>`) + (after || '');
  });
  
  // 转义剩余的 HTML 特殊字符（但保护占位符）
  // 先转义，然后恢复占位符
  html = escapeHtml(html);
  
  // 恢复占位符（按索引倒序，避免替换冲突）
  const sortedKeys = Object.keys(placeholders).sort((a, b) => {
    const aMatch = a.match(/\d+/);
    const bMatch = b.match(/\d+/);
    const aIdx = aMatch ? parseInt(aMatch[0]!) : 0;
    const bIdx = bMatch ? parseInt(bMatch[0]!) : 0;
    return bIdx - aIdx; // 倒序，从大到小
  });
  
  sortedKeys.forEach(key => {
    // 直接替换，因为占位符使用控制字符，不会被转义影响
    html = html.split(key).join(placeholders[key]!);
  });
  
  // 换行处理
  html = html.replace(/\n\n+/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");
  
  // 如果没有被 <p> 包裹，添加段落标签
  if (!html.startsWith("<p>")) {
    html = "<p>" + html + "</p>";
  }
  
  return html;
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function ReportContent({ content }: ReportContentProps) {
  // 过滤掉 JSON 格式的内容（如果 LLM 意外返回了 JSON）
  // 同时移除标题 "# 八字命理分析报告"
  const cleanContent = (() => {
    if (!content) return "";
    
    let cleaned = content;
    
    // 移除标题 "# 八字命理分析报告"（支持多种变体）
    cleaned = cleaned.replace(/^#+\s*八字命理分析报告\s*$/gm, "");
    cleaned = cleaned.replace(/^#+\s*八字分析报告\s*$/gm, "");
    cleaned = cleaned.replace(/^#+\s*命理分析报告\s*$/gm, "");
    
    // 检查是否包含 JSON 对象（以 { 开头，以 } 结尾）
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      // 移除 JSON 部分
      cleaned = cleaned.replace(/\{[\s\S]*\}/, "").trim();
    }
    
    return cleaned.trim();
  })();

  // 将 Markdown 解析为章节卡片
  const renderMarkdown = (markdown: string) => {
    if (!markdown || markdown.trim() === "") {
      return <p style={{ color: "#6b7280", fontStyle: "italic" }}>报告内容正在生成中...</p>;
    }

    const lines = markdown.split("\n");
    const sections: Array<{ title: string; paragraphs: string[] }> = [];
    let currentSection: { title: string; paragraphs: string[] } | null = null;
    let currentParagraph: string[] = [];

    lines.forEach((line) => {
      // 跳过 JSON 格式的行
      if (line.trim().startsWith("{") || line.trim().startsWith("}")) {
        return;
      }

      // 匹配所有级别的标题：##, ###, #### 等（但不包括 #，因为那是主标题）
      // 支持标题前有空格的情况
      const trimmedLine = line.trim();
      const headingMatch = trimmedLine.match(/^(#{2,})\s+(.+)$/);
      if (headingMatch) {
        // 新章节开始，保存上一个章节的最后一个段落
        if (currentParagraph.length > 0) {
          if (!currentSection) {
            currentSection = { title: "报告内容", paragraphs: [] };
          }
          currentSection.paragraphs.push(currentParagraph.join("\n"));
          currentParagraph = [];
        }
        if (currentSection && currentSection.paragraphs.length > 0) {
          sections.push(currentSection);
        }
        // 提取标题文本（去掉 # 号和空格）
        const title = headingMatch[2]!.trim();
        currentSection = { title, paragraphs: [] };
      } else if (trimmedLine === "") {
        // 空行，结束当前段落
        if (currentParagraph.length > 0) {
          if (!currentSection) {
            currentSection = { title: "报告内容", paragraphs: [] };
          }
          currentSection.paragraphs.push(currentParagraph.join("\n"));
          currentParagraph = [];
        }
      } else {
        // 段落内容
        if (!currentSection) {
          // 如果还没有章节，创建一个默认章节
          currentSection = { title: "报告内容", paragraphs: [] };
        }
        currentParagraph.push(line);
      }
    });

    // 处理最后一个段落和章节
    if (currentParagraph.length > 0) {
      if (!currentSection) {
        currentSection = { title: "报告内容", paragraphs: [] };
      }
      currentSection.paragraphs.push(currentParagraph.join("\n"));
    }
    if (currentSection && currentSection.paragraphs.length > 0) {
      sections.push(currentSection);
    }

    // 如果没有章节，返回默认内容
    if (sections.length === 0) {
      return <p style={{ color: "#6b7280", fontStyle: "italic" }}>报告内容正在生成中...</p>;
    }

    // 调试：检查解析的章节
    if (process.env.NODE_ENV === "development") {
      console.log("[Markdown Parse] 解析到的章节数量:", sections.length);
      console.log("[Markdown Parse] 章节标题:", sections.map(s => s.title));
    }

    // 图标映射（根据标题关键词）
    const getIcon = (title: string) => {
      if (title.includes("性格") || title.includes("核心")) return "🌟";
      if (title.includes("事业") || title.includes("财富")) return "💼";
      if (title.includes("感情") || title.includes("婚姻")) return "💕";
      if (title.includes("健康")) return "🏥";
      if (title.includes("大运") || title.includes("十年")) return "📈";
      if (title.includes("流年") || title.includes("当前")) return "📅";
      return "✨";
    };

    // 为不同章节分配不同的背景色（循环使用）
    const bgColors = [
      "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)", // 粉色
      "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)", // 紫色
      "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", // 蓝色
      "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", // 黄色
      "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", // 绿色
      "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)", // 粉紫
    ];

    // 渲染章节卡片
    return sections.map((section, idx) => {
      const bgColor = bgColors[idx % bgColors.length];

      return (
        <div
          key={idx}
          style={{
            borderRadius: "clamp(12px, 3vw, 16px)",
            background: bgColor,
            padding: "clamp(16px, 4vw, 20px)",
            marginBottom: "clamp(12px, 3vw, 16px)",
            borderTopLeftRadius: "clamp(12px, 3vw, 16px)",
          }}
        >
          {/* 标题区域 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(6px, 1.5vw, 8px)",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: "clamp(18px, 4.5vw, 20px)" }}>{getIcon(section.title)}</span>
            <h2
              style={{
                fontSize: "clamp(16px, 4vw, 18px)",
                fontWeight: 700,
                color: "#581c87",
                margin: 0,
              }}
            >
              {section.title}
            </h2>
          </div>

          {/* 内容段落 */}
          <div style={{ color: "#374151", lineHeight: 1.8 }}>
            {section.paragraphs.map((para, pIdx) => {
              const renderedHtml = renderMarkdownInline(para);
              // 调试：检查渲染结果
              if (process.env.NODE_ENV === "development" && para.includes("**")) {
                console.log("[Markdown Render] 原始:", para);
                console.log("[Markdown Render] 渲染后:", renderedHtml);
              }
              return (
                <div
                  key={pIdx}
                  style={{
                    marginBottom: "clamp(10px, 2.5vw, 12px)",
                    fontSize: "clamp(14px, 3.5vw, 15px)",
                    lineHeight: 1.8,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px, 3vw, 16px)" }}>
      {/* 顶部主题卡片 */}
      <div
        style={{
          borderRadius: "clamp(12px, 3vw, 16px)",
          background: "linear-gradient(135deg, rgba(252, 211, 237, 0.6) 0%, rgba(221, 214, 254, 0.5) 50%, rgba(219, 234, 254, 0.6) 100%)",
          padding: "clamp(16px, 4vw, 20px)",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 9999,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "clamp(5px, 1.2vw, 6px) clamp(10px, 2.5vw, 12px)",
              fontSize: "clamp(11px, 2.5vw, 12px)",
              fontWeight: 600,
              color: "#9333ea",
            }}
          >
            <span>💡</span>
            <span>年度主题概览</span>
          </div>
        </div>
        <p style={{ fontSize: "clamp(13px, 3vw, 14px)", color: "#374151", lineHeight: 1.6 }}>
          下面的内容来自 AI 八字写作引擎，为你梳理这一阶段在人生不同领域里的重点课题和成长机会。
        </p>
      </div>

      {/* 主体 Markdown 内容 */}
      <div style={{ maxWidth: "100%" }}>
        {renderMarkdown(cleanContent)}
      </div>

      {/* 结尾祝福语块 */}
      <div
        style={{
          marginTop: 8,
          borderRadius: "clamp(12px, 3vw, 16px)",
          background: "linear-gradient(135deg, #fdf2f8 0%, #eef2ff 100%)",
          padding: "clamp(16px, 4vw, 20px)",
          textAlign: "center",
          fontSize: "clamp(13px, 3vw, 14px)",
          color: "#4b5563",
        }}
      >
        <div style={{ fontSize: "clamp(24px, 6vw, 32px)", color: "#a855f7", marginBottom: 4 }}>&quot;</div>
        <p style={{ marginBottom: "clamp(6px, 1.5vw, 8px)" }}>
          报告写到这里，新的旅程才刚刚开始。
        </p>
        <p style={{ marginBottom: "clamp(6px, 1.5vw, 8px)" }}>
          愿你在接下来的日子里，一边拥抱变化，一边稳住内心的锚点。
        </p>
        <p style={{ fontSize: "clamp(11px, 2.5vw, 12px)", color: "#6b7280", marginTop: 8 }}>
          * 本报告仅用于自我探索与娱乐参考，不构成任何现实决策依据。
        </p>
      </div>
    </div>
  );
}

