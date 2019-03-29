const AWS = require('aws-sdk');

const s3 = new AWS.S3();

function s3call(method, params) {
    return new Promise((resolve, reject) => {
        s3[method](params, function(err, data) {
            if (err && (err.code === 'NotFound' || err.code === 'NoSuchKey')) {
                resolve(null);
            } else if (err) {
                console.error(method, params, err);
                reject(err);
            } else resolve(data);
        });
    });
}

/**
    @arg {string} what = objectExists, ..
    @arg {object} params = {Bucket, Key}
*/
function waitFor(method, params /*, responseHeaders*/) {
    return new Promise((resolve, reject) => {
        s3.waitFor(method, params, function(err, data) {
            if (err) {
                console.error(err);
                reject(err);
            } else resolve(data);
        });
    });
}

module.exports = {
    s3,
    s3call,
    waitFor,
};
