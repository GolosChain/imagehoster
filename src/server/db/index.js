const mongoose = require('mongoose');

const { mongoDbConnect } = require('../../config');
const ExternalImage = require('./ExternalImage');
const ResizedCache = require('./ResizedCache');

function connect() {
    mongoose.connect(mongoDbConnect, { useNewUrlParser: true });
}

module.exports = {
    connect,
    ExternalImage,
    ResizedCache,
};
