/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable static exports for Netlify
  output: 'export',
  // Set the output directory that Netlify will use
  distDir: '.next',
};

module.exports = nextConfig;
