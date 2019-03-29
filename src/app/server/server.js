const Koa = require('koa');
const cors = require('koa-cors');

const config = require('../../config');
const Apis = require('../../shared/api_client/ApiInstances');
const healthCheck = require('./health-check');
const uploadData = require('./upload-data');
const imageProxy = require('./image-proxy');
const dataServer = require('./data-server');

Apis.instance().init();

const app = new Koa();

app.use(cors());
app.use(healthCheck);
app.use(dataServer);
app.use(uploadData);
app.use(imageProxy);

app.listen(config.port);
console.log(`Application started on port ${config.port}`);
