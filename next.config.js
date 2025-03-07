/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    strictNextHead: false,
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
    domains: ['your-image-domain.com'], // 替换为你的图片域名
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