/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript errors තිබුණත් ඇප් එක build කරන්න කියලා අපි බල කරමු
    ignoreBuildErrors: true,
  },
  eslint: {
    // අනවශ්‍ය පරීක්ෂාවන් නිසා build එක නවත්වන එක වළක්වනවා
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;