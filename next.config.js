/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "public.blob.vercel-storage.com",
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["@vercel/blob"],
  },
};

module.exports = nextConfig;