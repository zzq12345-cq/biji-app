/** @type {import('next').NextConfig} */
const nextConfig = {
  // 增加 API 请求体大小限制（PDF 图片可能较大）
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // 外部包配置
  serverExternalPackages: ['pdfjs-dist'],
};

export default nextConfig;
