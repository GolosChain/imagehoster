const fs = require('fs-extra');
const path = require('path');

async function saveToStorage(dir, filename, buffer) {
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

async function getFromStorage(dir, filename) {
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

module.exports = {
    saveToStorage,
    getFromStorage,
};
