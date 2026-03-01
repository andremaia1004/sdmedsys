const nextConfig = {
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    experimental: {
        serverComponentsExternalPackages: ['pdfkit'],
        outputFileTracingIncludes: {
            '/*': ['./features/documents/fonts/**/*']
        }
    }
};

export default nextConfig;
