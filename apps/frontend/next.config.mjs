/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    unoptimized: true
  },
  // Keep static export for production, but allow API routes during development
  outputFileTracingIncludes: {
    '/': ['./public/**/*'],
  },
  // Rewrites for local development
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return {
        beforeFiles: [
          {
            source: '/api/:path*',
            destination: 'http://localhost:3000/api/:path*',
          },
        ],
      };
    }
    return [];
  },
  trailingSlash: true,
};

export default nextConfig;
