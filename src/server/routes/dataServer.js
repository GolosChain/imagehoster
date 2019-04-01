const router = require('koa-router')();

const config = require('../../config');
const { getFromStorage } = require('../utils/discStorage');
const { missing } = require('../utils/validation');

router.get('/images/:filename', function*() {
    try {
        if (missing(this, this.params, 'filename')) {
            return;
        }

        const { filename } = this.params;

        try {
            this.body = yield getFromStorage(filename);
        } catch (err) {
            if (err.code === 'ENOENT') {
                this.status = 404;
                this.statusText = 'File not found';
                this.body = { error: this.statusText };
                return;
            }

            console.error('Open file failed:', err);
            this.status = 500;
            this.statusText = `Error fetching ${filename}`;
            this.body = { error: this.statusText };
        }
    } catch (err) {
        console.error(err);
        this.status = 500;
        this.statusText = 'Internal server error';
        this.body = { error: this.statusText };
    }
});

module.exports = router.routes();
