const makeModel = require('./makeModel');

module.exports = makeModel(
    'ResizedCache',
    {
        originalFileId: String,
        fileId: String,
        dimensions: String,
        timestamp: Date,
    },
    {
        index: [
            {
                fields: {
                    originalFileId: 1,
                },
                options: {
                    unique: true,
                },
            },
            {
                fields: {
                    originalFileId: 1,
                    dimensions: 1,
                },
                options: {
                    unique: true,
                },
            },
            {
                fields: {
                    timestamp: 1,
                },
            },
        ],
    }
);
