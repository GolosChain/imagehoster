const fs = require('fs-extra');
const path = require('path');

const { filesPath } = require('../../config');

async function saveTo(dir, filename, buffer) {
    const { subDir, subInnerDir, fullPath } = formatFullPath(dir, filename);

    if (!(await fs.exists(subDir))) {
        await fs.mkdir(subDir, 0o744);
    }

    if (!(await fs.exists(subInnerDir))) {
        await fs.mkdir(subInnerDir, 0o744);
    }

    if (await fs.exists(fullPath)) {
        console.log('Duplicate registered');
        return;
    }

    const tmpFileName = fullPath + '.tmp';

    await fs.writeFile(tmpFileName, buffer);
    await fs.rename(tmpFileName, fullPath);
}

async function getFrom(dir, filename) {
    const { fullPath } = formatFullPath(dir, filename);

    return fs.readFile(fullPath);
}

function formatFullPath(dir, filename) {
    const subDir = path.join(dir, filename.substr(0, 2));
    const subInnerDir = path.join(subDir, filename.substr(0, 4));

    const fullPath = path.join(subInnerDir, filename);

    return {
        subDir,
        subInnerDir,
        fullPath,
    };
}

function saveToStorage(fileId, buffer) {
    return saveTo(filesPath, fileId, buffer);
}

function getFromStorage(fileId) {
    return getFrom(filesPath, fileId);
}

// function getRandomFileId() {
//     return new Promise((resolve, reject) => {
//         crypto.randomBytes(20, (err, buffer) => {
//             if (err) {
//                 reject(err);
//             } else {
//                 resolve(base58.encode(buffer));
//             }
//         });
//     });
// }

module.exports = {
    saveToStorage,
    getFromStorage,
};
