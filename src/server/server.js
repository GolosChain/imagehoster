const Koa = require('koa');
const cors = require('koa-cors');

const config = require('../config');

console.log('> Applications starting with config:', config);

const healthCheck = require('./routes/healthCheck');
const dataServer = require('./routes/dataServer');
const uploadData = require('./routes/uploadData');
// const imageProxy = require('./routes/image-proxy');

const app = new Koa();

app.use(cors());
app.use(healthCheck);
app.use(dataServer);
app.use(uploadData);
// app.use(imageProxy);

app.listen(config.port);
console.log(`> Application started on port ${config.port}`);
