function missing(ctx, fields, name, errorText = name) {
    if (!fields || !fields[name]) {
        ctx.status = 400;
        ctx.statusText = `Missing: ${errorText}`;
        ctx.body = { error: ctx.statusText };
        return true;
    }
    return false;
}

module.exports = {
    missing,
};
