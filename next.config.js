/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable static exports for Netlify
  output: 'export',
  // Set the output directory that Netlify will use
  distDir: '.next',
  // Increase build timeout and memory allocation
  experimental: {
    turbotrace: {
      memoryLimit: 4096
    }
  },
  // Disable type checking during build for better performance
  typescript: {
    ignoreBuildErrors: true
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
