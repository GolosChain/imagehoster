const Koa = require('koa');
const cors = require('koa-cors');

const { connect } = require('./db');
const config = require('../config');
const { startIntervalCleaning } = require('./utils/cleaning');

console.log('\n> Applications starting with config:\n============\n', config, '\n============');

const healthCheck = require('./routes/healthCheck');
const dataServer = require('./routes/dataServer');
const uploadData = require('./routes/uploadData');
const imageProxy = require('./routes/imageProxy');

connect();

const app = new Koa();

app.use(cors());
app.use(healthCheck);
app.use(dataServer);
app.use(uploadData);
app.use(imageProxy);

const port = process.env.IN_DOCKER ? 80 : config.port;

app.listen(port);
console.log(`> Application started on port ${port}`);

startIntervalCleaning();
