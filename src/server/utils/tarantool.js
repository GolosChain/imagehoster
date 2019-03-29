const TarantoolConnection = require('tarantool-driver');
const config = require('../../config');

const { host, port, username, password } = config.tarantool;

let conn;
let ready_promise;

const reset = p =>
    p.catch(error => {
        console.error('Tarantool error', error.message);

        if (error.message.indexOf('connect') >= 0) {
            conn = null;
        }

        throw error;
    });

function init() {
    if (conn) {
        return ready_promise;
    }

    conn = new TarantoolConnection({ host, port });

    return (ready_promise = new Promise(resolve => {
        resolve(
            conn
                .connect()
                .then(() => conn.auth(username, password))
                .then(() => conn)
        );
    }));
}

// Wrap Tarantool's methods with connection reseting code
module.exports = {
    call: (...args) => reset(init().then(t => t.call(...args))),
};
