/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@obliq/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    // @obliq/shared is authored for tsc's NodeNext resolution (explicit .js
    // specifiers pointing at .ts source); teach webpack to resolve those too.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
