/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com', 'images.unsplash.com', 'avatars.githubusercontent.com'],
  },
  transpilePackages: ['@agentforge/shared'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*'],
  },
};

module.exports = nextConfig;
