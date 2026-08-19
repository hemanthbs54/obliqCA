/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@obliq/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
