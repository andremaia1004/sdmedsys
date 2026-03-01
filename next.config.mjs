const nextConfig = {
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    serverExternalPackages: ['pdfkit'],
    outputFileTracingIncludes: {
        '/*': ['./features/documents/fonts/*', './logo-clinica/*']
    }
};

export default nextConfig;
