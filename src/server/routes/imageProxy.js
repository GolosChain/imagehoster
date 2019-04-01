const router = require('koa-router')();
const sharp = require('sharp');
const urlParser = require('url');
const request = require('request-promise-native');

const { ExternalImage, ResizedCache } = require('../db');
const { getFromStorage, saveToCache, getFromCache } = require('../utils/discStorage');
const { processAndSave } = require('../utils/uploading');

router.get('/images/:width(\\d+)x:height(\\d+)/:fileId', function*() {
    const width = Number(this.params.width);
    const height = Number(this.params.width);
    const fileId = this.params.fileId;
    let buffer;

    if (yield checkResizedCache(this, { fileId, width, height })) {
        return;
    }

    try {
        buffer = yield getFromStorage(fileId);
    } catch (err) {
        if (err.code === 'ENOENT') {
            notFoundError(this);
            return;
        }

        internalError(this);
        return;
    }

    yield process(this, {
        fileId,
        width,
        height,
        buffer,
    });
});

router.get('/proxy/:width(\\d+)x:height(\\d+)/:url(.*)', function*() {
    const width = Number(this.params.width);
    const height = Number(this.params.width);

    const url = decodeURIComponent(this.request.originalUrl.match(/^\/proxy\/\d+x\d+\/(.+)$/)[1]);

    const urlInfo = urlParser.parse(url);

    let buffer;
    let fileId;

    if (urlInfo.protocol === 'https:' && urlInfo.host === 'images.golos.io') {
        const match = urlInfo.path.match(/^\/images\/([A-Za-z0-9]+\.(?:jpg|gif|png))$/);

        if (match) {
            fileId = match[1];

            // checkCache

            buffer = yield getFromStorage(fileId);
        }
    }

    if (!buffer) {
        const externalImage = yield ExternalImage.findOne(
            {
                url,
            },
            'fileId'
        );

        if (externalImage) {
            try {
                buffer = yield getFromStorage(externalImage.fileId);
            } catch (err) {
                console.warn('File not found in cache:', err);
            }
        }

        if (!buffer) {
            try {
                buffer = yield request({
                    url,
                    gzip: true,
                    encoding: null,
                    headers: {
                        'user-agent':
                            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
                    },
                });

                try {
                    const data = yield processAndSave(buffer);
                    buffer = data.buffer;

                    yield new ExternalImage({
                        url,
                        fileId: data.fileId,
                    }).save();
                } catch (err) {}
            } catch (err) {
                console.warn('Request failed:', err);
            }
        }
    }

    if (!buffer) {
        notFoundError(this);
        return;
    }

    if (yield checkResizedCache(this, { fileId, width, height })) {
        return;
    }

    yield process(this, { width, height, buffer });
});

function* checkResizedCache(ctx, { fileId, width, height }) {
    try {
        const resized = yield ResizedCache.findOne({
            originalFileId: fileId,
            dimensions: `${width}x${height}`,
        });

        if (resized) {
            ctx.body = yield getFromCache(resized.fileId);
            return true;
        }
    } catch (err) {
        console.warn('Resized cache reading failed:', err);
    }

    return false;
}

function* process(ctx, { fileId, width, height, buffer }) {
    try {
        const resizedCache = yield sharp(buffer)
            .resize(width, height)
            .toBuffer();

        ctx.body = resizedCache;

        setTimeout(async () => {
            try {
                const cacheFileId = await saveToCache(resizedCache);

                await new ResizedCache({
                    originalFileId: fileId,
                    fileId: cacheFileId,
                    dimensions: `${width}x${height}`,
                    timestamp: new Date(),
                }).save();
            } catch (err) {
                console.warn('Cache saving failed:', err);
            }
        }, 0);
    } catch {
        internalError(ctx);
    }
}

function notFoundError(ctx) {
    ctx.status = 404;
    ctx.statusText = 'Not found';
    ctx.body = { error: ctx.statusText };
}

function internalError(ctx) {
    ctx.status = 500;
    ctx.statusText = 'Something went wrong';
    ctx.body = { error: ctx.statusText };
}

module.exports = router.routes();
