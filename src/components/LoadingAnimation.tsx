"use client";

/**
 * 加载动画组件
 * 显示旋转加载动画
 */

interface LoadingAnimationProps {
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function LoadingAnimation({
  width = 200,
  height = 200,
  className,
}: LoadingAnimationProps) {
  return (
    <div
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      className={className}
    >
      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div
        style={{
          width: "60px",
          height: "60px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #87CEEB",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
    </div>
  );
}
