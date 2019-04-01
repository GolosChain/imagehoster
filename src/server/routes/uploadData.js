const router = require('koa-router')();
const koaBody = require('koa-body');
const fs = require('fs-extra');

const config = require('../../config');
const { processAndSave, UnsupportedType } = require('../utils/uploading');
const { missing } = require('../utils/validation');
const { asyncWrapper } = require('../utils/koa');

const bodyLimits = koaBody({
    multipart: true,
    formLimit: 20 * 1000 * 1024,
    // formidable: { uploadDir: '/tmp', }
});

router.post(
    '/upload',
    bodyLimits,
    asyncWrapper(async function(ctx) {
        const { files, fields } = ctx.request.body;

        if (!files) {
            missing(ctx, {}, 'file');
            return;
        }

        const fileNames = Object.keys(files);
        const { filename, filebase64 } = fields;

        if (!fileNames.length && !(filename && filebase64)) {
            missing(ctx, {}, 'file');
            return;
        }

        let buffer;

        if (fileNames.length) {
            const file = files[fileNames[0]];

            try {
                buffer = await fs.readFile(file.path);
                await fs.unlink(file.path);
            } catch (err) {
                console.error('Reading file failed:', err);
                ctx.status = 400;
                ctx.statusText = 'Upload failed';
                ctx.body = { error: ctx.statusText };
                return;
            }
        } else {
            try {
                buffer = new Buffer(filebase64, 'base64');
            } catch (err) {
                console.error('Invalid base64:', err);
                ctx.status = 400;
                ctx.statusText = 'Invalid base64 encoding';
                ctx.body = { error: ctx.statusText };
                return;
            }
        }

        try {
            const { fileId } = await processAndSave(buffer);

            const { protocol, host, port } = config;
            const filePath = `images/${fileId}`;
            let url;

            if (protocol === 'https') {
                url = `https://${host}/${filePath}`;
            } else {
                url = `${protocol}://${host}:${port}/${filePath}`;
            }

            ctx.body = { url };
        } catch (err) {
            if (err instanceof UnsupportedType) {
                ctx.status = 400;
                ctx.statusText = 'Please upload only images.';
                ctx.body = { error: ctx.statusText };
            } else {
                console.warn('Processing failed:', err);
                ctx.status = 500;
                ctx.statusText = 'Internal server error';
                ctx.body = { error: ctx.statusText };
            }
        }
    })
);

module.exports = router.routes();
