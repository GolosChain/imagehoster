const mongoose = require('mongoose');

function makeModel(name, schemaConfig, optionsConfig = {}) {
    const schema = new mongoose.Schema(
        schemaConfig,
        Object.assign({ timestamps: true }, optionsConfig.schema)
    );

    if (optionsConfig.index) {
        for (let indexConfig of optionsConfig.index) {
            schema.index(indexConfig.fields, indexConfig.options);
        }
    }

    return mongoose.model(name, schema);
}

module.exports = makeModel;
