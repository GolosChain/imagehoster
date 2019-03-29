const toBoolean = s => (s == null || s.trim() === '' ? false : JSON.parse(s));

const config = {
    // When protocol === 'https' a default port url is used (ignores UPLOAD_PORT)
    protocol: process.env.UPLOAD_HTTP_PROTOCOL || 'http',
    host: process.env.DOWNLOAD_HOST || 'images.golos.io',
    port: process.env.UPLOAD_PORT || 3234,
    tarantool: {
        host: process.env.TARANTOOL_HOST || 'localhost',
        port: process.env.TARANTOOL_PORT || 3301,
        username: process.env.TARANTOOL_USERNAME || 'guest',
        password: process.env.TARANTOOL_PASSWORD || '',
    },
    testKey: toBoolean(process.env.UPLOAD_TEST_KEY),
    uploadIpLimit: {
        minRep: parseFloat(process.env.UPLOAD_MIN_REP || 10),
    },
    uploadBucket: process.env.UPLOAD_PATH || './uploads',
    webBucket: process.env.IMAGEPROXY_BUCKET_WEB || 'dev-imageproxy-web',
    thumbnailBucket: process.env.IMAGEPROXY_BUCKET_THUMBNAIL || 'dev-imageproxy-thumbnail',
};

if (config.testKey) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('ERROR test key provided, do not use in production.');
    }
    console.log('WARNING test key provided, do not use in production.');
}

module.exports = config;
