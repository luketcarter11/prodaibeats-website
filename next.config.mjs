/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['localhost'],
    unoptimized: true,
  },
  swcMinify: true,
  
  // Set a custom output directory
  distDir: '.next',
  
  // Production settings
  typescript: {
    // Don't fail the build if there are TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Don't fail the build if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  experimental: {
    // This setting is important for avoiding errors with missing env vars during build
    missingSuspenseWithCSRBailout: false,
  },
  
  // Add custom config to serve files from tracks directory
  async rewrites() {
    return [
      {
        source: '/tracks/:path*',
        destination: '/tracks/:path*',
      },
    ];
  },
  
  // Configure webpack to handle audio files
  webpack(config) {
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/i,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/media/',
            outputPath: 'static/media/',
            name: '[name].[hash].[ext]',
          },
        },
      ],
    });

    return config;
  },
}

export default nextConfig 