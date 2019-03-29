const tarantool = require('./tarantool');

function missing(ctx, fields, name, errorText = name) {
    if (!fields || !fields[name]) {
        ctx.status = 400;
        ctx.statusText = `Missing: ${errorText}`;
        ctx.body = { error: ctx.statusText };
        return true;
    }
    return false;
}

function statusError(ctx, code, text) {
    ctx.status = code;
    ctx.statusText = text;
    ctx.body = { error: ctx.statusText };
}

function getRemoteIp(req) {
    const remote_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ip_match = remote_address ? remote_address.match(/(\d+\.\d+\.\d+\.\d+)/) : null;
    return ip_match ? ip_match[1] : esc(remote_address);
}

function esc(value, max_length = 256) {
    if (!value) {
        return '';
    }

    if (typeof value === 'number') {
        return value;
    }

    if (typeof value !== 'string') {
        return '(object)';
    }

    const res = value
        .substring(0, max_length - max_length * 0.2)
        .replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function(char) {
            switch (char) {
                case '\0':
                    return '\\0';
                case '\x08':
                    return '\\b';
                case '\x09':
                    return '\\t';
                case '\x1a':
                    return '\\z';
                case '\n':
                    return '\\n';
                case '\r':
                    return '\\r';
                // case '\'':
                // case "'":
                // case '"':
                // case '\\':
                // case '%':
                //     return '\\' + char; // prepends a backslash to backslash, percent, and double/single quotes
            }
            return '-';
        });

    return res.length < max_length ? res : '-';
}

/** RAM RateLimit.js was removed in commit: 26e7cc19e2eef6063764d211493f9616448c025b
 */
function* limit(ctx, type, key, description, unitLabel, amount = 1) {
    try {
        const [[{ over, desc }]] = yield tarantool.call(
            'limit',
            type,
            key,
            description,
            unitLabel,
            amount
        );

        if (over) {
            throw desc;
        }
    } catch (error) {
        // console.error(error)
        if (typeof error === 'string') {
            ctx.status = 400;
            ctx.statusText = error;
            ctx.body = { error: ctx.statusText };
            return true;
        }
    }
    return false;
}

/**
    This is a rough approximation of log10 that works with huge digit-strings.
    Warning: Math.log10(0) === NaN
*/
function log10(str) {
    const leadingDigits = parseInt(str.substring(0, 4));
    const log = Math.log(leadingDigits) / Math.log(10);
    const n = str.length - 1;
    return n + (log - parseInt(log));
}

const repLog10 = rep2 => {
    if (rep2 == null) {
        return rep2;
    }

    let rep = String(rep2);
    const neg = rep.charAt(0) === '-';
    rep = neg ? rep.substring(1) : rep;

    let out = log10(rep);

    if (isNaN(out)) {
        out = 0;
    }

    out = Math.max(out - 9, 0); // @ -9, $0.50 earned is approx magnitude 1
    out = (neg ? -1 : 1) * out;
    out = out * 9 + 25; // 9 points per magnitude. center at 25
    // base-line 0 to darken and < 0 to auto hide (grep rephide)
    out = parseInt(out);

    return out;
};

module.exports = {
    missing,
    statusError,
    getRemoteIp,
    limit,
    repLog10,
};
