const router = require('koa-router')();
const koaBody = require('koa-body');
const fs = require('fs');
const fileType = require('file-type');
const multihash = require('multihashes');
const base58 = require('bs58');
const sharp = require('sharp');

const config = require('../../config');
// const { hash, Signature, PublicKey, PrivateKey } = require('../../shared/ecc');
const { repLog10 } = require('../utils/utils');
const { exif, hasLocation, hasOrientation } = require('../utils/exif-utils');
const { missing, getRemoteIp, limit } = require('../utils/utils');
const { putToStorage } = require('../utils/disc-storage');

const { protocol, host, port, uploadBucket } = config;

const bodyLimits = koaBody({
    multipart: true,
    formLimit: 20 * 1000 * 1024,
    // formidable: { uploadDir: '/tmp', }
});

router.post('/:username/:signature', bodyLimits, function*() {
    // TODO: Temp disable limits
    // const ip = getRemoteIp(this.req);
    //
    // if (yield limit(this, 'uploadIp', ip, 'Uploads', 'request')) {
    //     return;
    // }

    // if (missing(this, this.params, 'username') || missing(this, this.params, 'signature')) {
    //     return;
    // }

    const { files, fields } = this.request.body;

    const fileNames = Object.keys(files);
    const { filename, filebase64 } = fields;

    if (!fileNames.length && !(filename && filebase64)) {
        missing(this, {}, 'file');
        return;
    }

    const { signature } = this.params;
    const sig = parseSig(signature);

    if (!sig) {
        this.status = 400;
        this.statusText = `Unable to parse signature (expecting HEX data).`;
        this.body = { error: this.statusText };
        return;
    }

    const { username } = this.params;
    let posting;

    let fbuffer, fname;

    if (fileNames.length) {
        const file = files[fileNames[0]];
        fname = file.name;
        // How can I keep a multipart form upload in memory (skip the file)?
        // https://github.com/tunnckoCore/koa-better-body/issues/67
        fbuffer = yield new Promise(resolve => {
            fs.readFile(file.path, 'binary', (err, data) => {
                if (err) {
                    console.error(err);
                    this.status = 400;
                    this.statusText = `Upload failed.`;
                    this.body = { error: this.statusText };
                    resolve();
                    return;
                }
                fs.unlink(file.path);
                resolve(new Buffer(data, 'binary'));
            });
        });

        if (!fbuffer) {
            return;
        }
    } else {
        fname = filename ? filename : '';
        fbuffer = new Buffer(filebase64, 'base64');
    }

    let mime;
    const ftype = fileType(fbuffer);

    if (ftype) {
        mime = ftype.mime;
        if (!fname || fname === '' || fname === 'blob') {
            fname = `image.${ftype.ext}`;
        }
    }

    if (!/^image\/(gif|jpeg|png)$/.test(mime)) {
        this.status = 400;
        this.statusText = 'Please upload only images.';
        this.body = { error: this.statusText };
        console.log(`Upload rejected, file: ${fname} mime: ${mime}`);
        return;
    }

    // The challenge needs to be prefixed with a constant (both on the server and checked on the client) to make sure the server can't easily make the client sign a transaction doing something else.
    const prefix = new Buffer('ImageSigningChallenge');
    const shaVerify = hash.sha256(Buffer.concat([prefix, fbuffer]));

    let userVerified = false;
    if (posting) {
        const testKey = config.testKey ? PrivateKey.fromSeed('').toPublicKey() : null;

        if (
            !sig.verifyHash(shaVerify, posting) &&
            !(testKey && sig.verifyHash(shaVerify, testKey))
        ) {
            this.status = 400;
            this.statusText = 'Signature did not verify.';
            this.body = { error: this.statusText };
            return;
        }
        userVerified = true;
    } else {
        console.log('WARN: Skipped signature verification (steemd connection problem?)');
    }

    if (userVerified) {
        // don't affect the quote unless the user is verified
        const megs = fbuffer.length / (1024 * 1024);
        if (yield limit(this, 'uploadData', username, 'Upload size', 'megabytes', megs)) {
            return;
        }
    }

    // Data hash (D)
    const sha = hash.sha256(fbuffer);
    const key = 'D' + base58.encode(multihash.encode(sha, 'sha2-256'));

    if (mime === 'image/jpeg') {
        try {
            const exifData = yield exif(fbuffer);
            const orientation = hasOrientation(exifData);
            const location = hasLocation(exifData);

            if (location || orientation) {
                const image = sharp(fbuffer);

                // For privacy, remove: GPS Information, Camera Info, etc..
                // Sharp will remove EXIF info by default unless withMetadata is called..
                if (!location) {
                    image.withMetadata();
                }

                // Auto-orient based on the EXIF Orientation.  Remove orientation (if any)
                if (orientation) {
                    image.rotate();
                }

                // Verify signature before altering fbuffer
                fbuffer = yield image.toBuffer();
            }
        } catch (err) {
            console.error('upload-data process image', key, err.message);
        }
    }

    yield new Promise(resolve => {
        const fnameUri = encodeURIComponent(fname);

        putToStorage(uploadBucket, key, fbuffer, fnameUri)
            .then(() => {
                console.log(`Uploaded '${fname}' to ${uploadBucket}${key}`);
                const url =
                    protocol === 'https'
                        ? `https://${host}/${key}/${fnameUri}`
                        : `${protocol}://${host}:${port}/${key}/${fnameUri}`;

                this.body = { url };
                resolve();
            })
            .catch(err => {
                console.log(err);
                this.status = 400;
                this.statusText = `Error uploading ${key}.`;
                this.body = { error: this.statusText };
                resolve();
            });
    });
});

const parseSig = hexSig => {
    try {
        return Signature.fromHex(hexSig);
    } catch (e) {
        return null;
    }
};

module.exports = router.routes();
