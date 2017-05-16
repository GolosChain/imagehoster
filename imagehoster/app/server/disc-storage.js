import fs from 'fs'

export function putToStorage(dir, key, buffer, fname) {
    return new Promise((resolve, reject) => {

        fs.writeFile(dir + key + '.bin', buffer, { encoding: null }, function (err) {
            if (err) {
                console.log(err);
                reject(err)
            }
            else resolve(buffer);
        });

        fs.writeFile(dir + key + '.url', fname, { encoding: 'utf-8' }, function (err) {
            if (err) {
                console.log(err);
                reject(err)
            }
            else resolve(buffer);
        });
    })
}

export function getFromStorage(dir, key) {
    return new Promise((resolve, reject) => {

        fs.readFile(dir + key + '.bin', function (err, data) {
            if (err) {
                console.log(err);
                reject(err)
            }
            else resolve(data);
        });

        // fs.readFile(dir + key + '.url', function (err, data) {
        //     if (err) {
        //         console.log(err);
        //         reject(err)
        //     }
        //     else resolve(data);
        // });
    })
}