const config = {
    // When protocol === 'https' a default port url is used (ignores UPLOAD_PORT)
    protocol: process.env.UPLOAD_HTTP_PROTOCOL || 'http',
    host: process.env.DOWNLOAD_HOST || 'images.golos.io',
    port: process.env.UPLOAD_PORT || 3234,
    uploadDir: process.env.UPLOAD_PATH || './uploads',
};

module.exports = config;
