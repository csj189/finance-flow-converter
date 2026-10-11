/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['exceljs', '@aws-sdk/client-textract'],
  },
};

export default nextConfig;
