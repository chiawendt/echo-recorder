/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/echo-recorder' : '',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
