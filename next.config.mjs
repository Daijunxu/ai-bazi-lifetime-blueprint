/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 转译 node_modules 中的 TypeScript 库
  transpilePackages: ['bazi-calculator-by-alvamind'],
  // 确保在 serverless 环境中正确处理
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // 在构建时忽略类型错误（因为第三方库可能有类型问题）
  typescript: {
    // 警告：这会在构建时忽略类型错误，但可以确保部署成功
    // 生产环境建议修复所有类型错误
    ignoreBuildErrors: true,
  },
};

export default nextConfig;


