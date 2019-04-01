const mongoose = require('mongoose');

const ExternalImage = require('./ExternalImage');
const ResizedCache = require('./ResizedCache');

function connect() {
    mongoose.connect('mongodb://localhost:27017/imagehoster', { useNewUrlParser: true });
}

module.exports = {
    connect,
    ExternalImage,
    ResizedCache,
};
