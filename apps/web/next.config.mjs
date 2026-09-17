/** @type {import('next').NextConfig} */
const nextConfig = {
  // `next dev` and `next build` get separate output folders, so running a
  // production build (e.g. via `pnpm typecheck`) can't break a running dev server.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
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
