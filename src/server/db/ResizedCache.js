const makeModel = require('./makeModel');

module.exports = makeModel(
    'ResizedCache',
    {
        originalFileId: String,
        fileId: String,
        dimensions: String,
        cleaning: Boolean,
        timestamp: Date,
    },
    {
        index: [
            {
                fields: {
                    originalFileId: 1,
                },
            },
            {
                fields: {
                    originalFileId: 1,
                    dimensions: 1,
                },
            },
            {
                fields: {
                    timestamp: 1,
                    cleaning: 1,
                },
            },
        ],
    }
);
