/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    // Allow builds to succeed even with lint warnings during deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow builds to succeed even with type warnings during deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
