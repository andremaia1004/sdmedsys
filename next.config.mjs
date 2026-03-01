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
            '/*': ['./features/documents/fonts/*', './logo-clinica/*']
        }
    }
};

export default nextConfig;
