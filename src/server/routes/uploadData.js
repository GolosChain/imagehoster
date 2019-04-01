const router = require('koa-router')();
const koaBody = require('koa-body');
const fs = require('fs-extra');

const { processAndSave, UnsupportedType } = require('../utils/uploading');
const { missing } = require('../utils/validation');

const bodyLimits = koaBody({
    multipart: true,
    formLimit: 20 * 1000 * 1024,
    // formidable: { uploadDir: '/tmp', }
});

router.post('/upload', bodyLimits, function*() {
    const { files, fields } = this.request.body;

    if (!files) {
        missing(this, {}, 'file');
        return;
    }

    const fileNames = Object.keys(files);
    const { filename, filebase64 } = fields;

    if (!fileNames.length && !(filename && filebase64)) {
        missing(this, {}, 'file');
        return;
    }

    let buffer;

    if (fileNames.length) {
        const file = files[fileNames[0]];

        try {
            buffer = yield fs.readFile(file.path);
            yield fs.unlink(file.path);
        } catch (err) {
            console.error('Reading file failed:', err);
            this.status = 400;
            this.statusText = 'Upload failed';
            this.body = { error: this.statusText };
            return;
        }
    } else {
        try {
            buffer = new Buffer(filebase64, 'base64');
        } catch (err) {
            console.error('Invalid base64:', err);
            this.status = 400;
            this.statusText = 'Invalid base64';
            this.body = { error: this.statusText };
            return;
        }
    }

    try {
        const { fileId, buffer } = yield processAndSave(buffer);

        const { protocol, host, port } = config;
        const filePath = `images/${fileId}`;
        let url;

        if (protocol === 'https') {
            url = `https://${host}/${filePath}`;
        } else {
            url = `${protocol}://${host}:${port}/${filePath}`;
        }

        this.body = { url };
    } catch (err) {
        if (err instanceof UnsupportedType) {
            this.status = 400;
            this.statusText = 'Please upload only images.';
            this.body = { error: this.statusText };
        } else {
            console.warn('Processing failed:', err);
            this.status = 500;
            this.statusText = 'Internal server error';
            this.body = { error: this.statusText };
        }
    }
});

module.exports = router.routes();
