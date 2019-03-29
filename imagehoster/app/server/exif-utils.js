const ExifImage = require('exif').ExifImage;

function* exif(buffer) {
    return new Promise((resolve, reject) => {
        try {
            const exifImage = new ExifImage();
            exifImage.loadImage(buffer, function(error, data) {
                if (error) {
                    if (error.code === 'NO_EXIF_SEGMENT') {
                        resolve(null);
                    } else {
                        reject(error);
                    }
                } else {
                    resolve(data);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

const hasOrientation = (d = {}) => d && d.image && d.image.Orientation != null;
const hasLocation = (d = {}) =>
    d && d.gps && Object.keys(d.gps).find(key => /Latitude|Longitude|Altitude/i.test(key)) != null;

module.exports = {
    exif,
    hasOrientation,
    hasLocation,
};
