const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/users', require('./modules/users/user.routes.js'));
app.use('/api/routes', require('./modules/routes/routes.routes.js'));

module.exports = app;
