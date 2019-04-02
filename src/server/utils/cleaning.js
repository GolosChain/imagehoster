/**
 * File currently not used.
 */

const { ResizedCache } = require('../db');
const { removeFromCache } = require('../utils/discStorage');

const RUN_EVERY = 10 * 60 * 1000;

const CACHE_INTERVAL = 2 * 24 * 60 * 60 * 1000;

function startIntervalCleaning() {
    setTimeout(async () => {
        try {
            const limit = new Date(Date.now() - CACHE_INTERVAL);

            await ResizedCache.updateMany(
                {
                    timestamp: {
                        $lt: limit,
                    },
                    cleaning: false,
                },
                {
                    cleaning: true,
                }
            );

            const removeBeforeTs = new Date(limit.getTime() - 30 * 1000);

            const cursor = ResizedCache.find({
                timestamp: {
                    $lt: removeBeforeTs,
                },
                cleaning: true,
            }).cursor();

            let doc;
            let counter = 0;

            while ((doc = await cursor.next())) {
                try {
                    console.log('Delete file:', doc.fileId);
                    await removeFromCache(doc.fileId);
                } catch (err) {
                    console.error('Cant remove file:', doc.fileId);
                }
                counter++;

                if (counter % 50 === 0) {
                    await sleep(30 * 1000);
                }
            }

            if (counter) {
                await ResizedCache.deleteMany({
                    timestamp: {
                        $lt: removeBeforeTs,
                    },
                    cleaning: true,
                });
            }
        } catch (err) {
            console.error('Cleaning failed:', err);
        }

        startIntervalCleaning();
    }, RUN_EVERY);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    startIntervalCleaning,
};
