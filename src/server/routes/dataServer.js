const router = require('koa-router')();

const { getFromStorage } = require('../utils/discStorage');
const { missing } = require('../utils/validation');
const { asyncWrapper } = require('../utils/koa');

router.get(
    '/images/:filename',
    asyncWrapper(async function(ctx) {
        try {
            if (missing(ctx, ctx.params, 'filename')) {
                return;
            }

            const { filename } = ctx.params;

            try {
                ctx.body = await getFromStorage(filename);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    ctx.status = 404;
                    ctx.statusText = 'File not found';
                    ctx.body = { error: ctx.statusText };
                    return;
                }

                console.error('Open file failed:', err);
                ctx.status = 500;
                ctx.statusText = `Error fetching ${filename}`;
                ctx.body = { error: ctx.statusText };
            }
        } catch (err) {
            console.error(err);
            ctx.status = 500;
            ctx.statusText = 'Internal server error';
            ctx.body = { error: ctx.statusText };
        }
    })
);

module.exports = router.routes();
