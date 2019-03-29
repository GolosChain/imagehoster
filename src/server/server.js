const Koa = require('koa');
const cors = require('koa-cors');

const config = require('../config');

console.log('> Applications starting with config:', config);

const healthCheck = require('./routes/health-check');
const dataServer = require('./routes/data-server');
const uploadData = require('./routes/upload-data');
const imageProxy = require('./routes/image-proxy');

const app = new Koa();

app.use(cors());
app.use(healthCheck);
app.use(dataServer);
app.use(uploadData);
app.use(imageProxy);

app.listen(config.port);
console.log(`> Application started on port ${config.port}`);
