const router = require('koa-router')();

const config = require('../config');
const { getFromStorage } = require('./disc-storage');
const { missing, getRemoteIp, limit } = require('./utils-koa');

router.get('/:hash/:filename?', function*() {
    try {
        const ip = getRemoteIp(this.req);

        if (yield limit(this, 'downloadIp', ip, 'Downloads', 'request')) {
            return;
        }

        if (missing(this, this.params, 'hash')) {
            return;
        }

        const { hash } = this.params;
        const key = `${hash}`;

        yield new Promise(resolve => {
            getFromStorage(config.uploadBucket, key)
                .then(data => {
                    this.body = new Buffer(data.toString('binary'), 'binary');
                    resolve();
                })
                .catch(err => {
                    console.log(err);
                    this.status = 400;
                    this.statusText = `Error fetching ${key}.`;
                    this.body = { error: this.statusText };
                    resolve();
                });
        });
    } catch (error) {
        console.error(error);
    }
});

module.exports = router.routes();
