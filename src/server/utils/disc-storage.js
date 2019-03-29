const fs = require('fs-extra');
const path = require('path');

async function putToStorage(dir, key, buffer) {
    const subDir = path.join(dir, key.substr(0, 2));
    const subInnerDir = path.join(subDir, key.substr(0, 4));

    if (!(await fs.exists(subDir))) {
        await fs.mkdir(subDir, 0o744);
    }

    if (!(await fs.exists(subInnerDir))) {
        await fs.mkdir(subInnerDir, 0o744);
    }

    const filePath = path.join(subInnerDir, key);

    if (await fs.exists(filePath)) {
        throw new Error('Filename collision');
    }

    await fs.writeFile(filePath, buffer);
}

async function getFromStorage(dir, key) {
    return await fs.readFile(dir + key + '.bin');
}

module.exports = {
    putToStorage,
    getFromStorage,
};
