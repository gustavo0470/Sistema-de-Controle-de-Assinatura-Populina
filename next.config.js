/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  images: {
    domains: [],
  },
}

module.exports = nextConfig
