/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone', // Disabled for Vercel
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    }
};

module.exports = nextConfig;
