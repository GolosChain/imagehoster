const { ExifImage } = require('exif');

function* exif(buffer) {
    return new Promise((resolve, reject) => {
        try {
            const exifImage = new ExifImage();

            exifImage.loadImage(buffer, function(err, data) {
                if (err) {
                    if (err.code === 'NO_EXIF_SEGMENT') {
                        resolve(null);
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(data);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}

function hasOrientation(d = {}) {
    if (d && d.image) {
        return d.image.Orientation != null;
    }

    return false;
}

function hasLocation(d = {}) {
    if (d && d.gps) {
        return Object.keys(d.gps).some(key => /Latitude|Longitude|Altitude/i.test(key));
    }

    return false;
}

module.exports = {
    exif,
    hasOrientation,
    hasLocation,
};
