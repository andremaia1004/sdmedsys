/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        // Ensuring app router is explicitly allowed if not default
        appDir: true,
    }
};

export default nextConfig;
