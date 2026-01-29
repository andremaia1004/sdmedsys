/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone', // Disabled for Vercel
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    }
};

module.exports = nextConfig;
