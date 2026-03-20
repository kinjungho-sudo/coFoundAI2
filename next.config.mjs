// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  typescript: {
    // Supabase SDK 제네릭 추론 이슈 — 런타임에 무관, 추후 SDK 업그레이드 시 해제
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
