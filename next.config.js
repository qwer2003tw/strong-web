const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    swSrc: "public/sw.js",
  },
});

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "@supabase/auth-helpers-react",
      "@supabase/supabase-js",
      "next-intl",
      "recharts",
    ],
  },
};

module.exports = withPWA(nextConfig);
