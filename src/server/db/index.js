const mongoose = require('mongoose');

const { mongoDbConnect } = require('../../config');
const ExternalImage = require('./ExternalImage');

function connect() {
    mongoose.connect(mongoDbConnect, { useNewUrlParser: true });
}

module.exports = {
    connect,
    ExternalImage,
};
