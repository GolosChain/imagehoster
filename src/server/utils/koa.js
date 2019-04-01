function asyncWrapper(func) {
    return function*() {
        yield func(this);
    };
}

module.exports = {
    asyncWrapper,
};
