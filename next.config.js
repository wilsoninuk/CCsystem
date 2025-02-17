/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // 移除 optimizeFonts 配置
    strictNextHead: false,
    images: {
      allowFutureImage: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      {
        protocol: 'https',
        hostname: 'v.png.pub',
        pathname: '/imgs/**'
      }
    ],
    domains: [], // 如果有远程域名需要在这里添加
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      stream: require.resolve('stream-browserify'),
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
}

module.exports = nextConfig 