/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    IS_BUILD_TIME: 'true',
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'canvas', 'jsdom', 'jspdf', '@aws-sdk/client-s3'],
  },
  // Any other existing configuration
}

module.exports = nextConfig 