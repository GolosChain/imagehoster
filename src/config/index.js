const config = {
    // When protocol === 'https' a default port url is used (ignores UPLOAD_PORT)
    host: process.env.DOMAIN_NAME || 'localhost',
    port: process.env.HOST_PORT || 3234,
    protocol: process.env.PROTOCOL || 'http',
    uploadDir: process.env.UPLOAD_PATH || './uploads',
    resizedDir: process.env.RESIZED_PATH || './resized',
    mongoDbConnect: process.env.MONGO_CONNECT || 'mongodb://localhost:27017/imagehoster',
};

module.exports = config;
