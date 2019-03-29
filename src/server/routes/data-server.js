const router = require('koa-router')();

const config = require('../../config');
const { getFromStorage } = require('../utils/disc-storage');
const { missing, getRemoteIp, limit } = require('../utils/utils');

router.get('/files/:filename', function*() {
    try {
        // const ip = getRemoteIp(this.req);
        //
        // if (yield limit(this, 'downloadIp', ip, 'Downloads', 'request')) {
        //     return;
        // }

        if (missing(this, this.params, 'filename')) {
            return;
        }

        const { filename } = this.params;

        try {
            this.body = yield getFromStorage(config.uploadBucket, filename);
        } catch (err) {
            console.log(err);
            this.status = 400;
            this.statusText = `Error fetching ${filename}`;
            this.body = { error: this.statusText };
        }
    } catch (err) {
        console.error(err);
        this.status = 500;
        this.statusText = `Internal server error`;
        this.body = { error: this.statusText };
    }
});

module.exports = router.routes();
