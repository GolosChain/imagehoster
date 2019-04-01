const makeModel = require('./makeModel');

module.exports = makeModel(
    'ExternalImage',
    {
        url: String,
        fileId: String,
        timestamp: Date,
    },
    {
        index: [
            {
                fields: {
                    url: 1,
                },
                options: {
                    unique: true,
                },
            },
        ],
    }
);
