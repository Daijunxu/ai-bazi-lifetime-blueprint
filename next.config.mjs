/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 转译 node_modules 中的 TypeScript 库
  transpilePackages: ['bazi-calculator-by-alvamind'],
  // 确保在 serverless 环境中正确处理
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;


