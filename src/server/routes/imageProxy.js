const router = require('koa-router')();
const sharp = require('sharp');
const urlParser = require('url');
const request = require('request-promise-native');

const { ExternalImage, ResizedCache } = require('../db');
const { getFromStorage, saveToCache, getFromCache } = require('../utils/discStorage');
const { processAndSave } = require('../utils/uploading');
const { asyncWrapper } = require('../utils/koa');

router.get(
    '/images/:width(\\d+)x:height(\\d+)/:fileId',
    asyncWrapper(async function(ctx) {
        const width = Number(ctx.params.width);
        const height = Number(ctx.params.width);
        const fileId = ctx.params.fileId;
        let buffer;

        if (await checkResizedCache(ctx, { fileId, width, height })) {
            return;
        }

        try {
            buffer = await getFromStorage(fileId);
        } catch (err) {
            if (err.code === 'ENOENT') {
                notFoundError(ctx);
                return;
            }

            internalError(ctx);
            return;
        }

        await process(ctx, {
            fileId,
            width,
            height,
            buffer,
        });
    })
);

router.get(
    '/proxy/:width(\\d+)x:height(\\d+)/:url(.*)',
    asyncWrapper(async function(ctx) {
        const width = Number(ctx.params.width);
        const height = Number(ctx.params.width);

        const url = decodeURIComponent(
            ctx.request.originalUrl.match(/^\/proxy\/\d+x\d+\/(.+)$/)[1]
        );

        const urlInfo = urlParser.parse(url);

        if (!urlInfo.hostname) {
            ctx.status = 400;
            ctx.statusText = 'Invalid url';
            ctx.body = { error: ctx.statusText };
            return;
        }

        let buffer;
        let fileId;

        if (urlInfo.protocol === 'https:' && urlInfo.host === 'images.golos.io') {
            const match = urlInfo.path.match(/^\/images\/([A-Za-z0-9]+\.(?:jpg|gif|png))$/);

            if (match) {
                fileId = match[1];

                if (await checkResizedCache(ctx, { fileId, width, height })) {
                    return;
                }

                buffer = await getFromStorage(fileId);
            }
        }

        if (!buffer) {
            const externalImage = await ExternalImage.findOne(
                {
                    url,
                },
                'fileId'
            );

            if (externalImage) {
                fileId = externalImage.fileId;

                if (await checkResizedCache(ctx, { fileId, width, height })) {
                    return;
                }

                try {
                    buffer = await getFromStorage(externalImage.fileId);
                } catch (err) {
                    console.warn('File not found in cache:', err);
                }
            }

            if (!buffer) {
                try {
                    buffer = await request({
                        url,
                        gzip: true,
                        encoding: null,
                        headers: {
                            'user-agent':
                                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36',
                        },
                    });

                    try {
                        const data = await processAndSave(buffer);
                        fileId = data.fileId;
                        buffer = data.buffer;

                        await new ExternalImage({
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
            notFoundError(ctx);
            return;
        }

        await process(ctx, { fileId, width, height, buffer });
    })
);

async function checkResizedCache(ctx, { fileId, width, height }) {
    try {
        const resized = await ResizedCache.findOne({
            originalFileId: fileId,
            dimensions: `${width}x${height}`,
            cleaning: false,
        });

        if (resized) {
            ctx.body = await getFromCache(resized.fileId);
            return true;
        }
    } catch (err) {
        console.warn('Resized cache reading failed:', err);
    }

    return false;
}

async function process(ctx, { fileId, width, height, buffer }) {
    try {
        const resizedCache = await sharp(buffer)
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
                    cleaning: false,
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
