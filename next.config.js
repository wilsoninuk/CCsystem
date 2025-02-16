/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // 移除 optimizeFonts 配置
    strictNextHead: false,
  }
}

module.exports = nextConfig 