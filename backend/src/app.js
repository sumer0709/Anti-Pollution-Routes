const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();
const cookieParser = require("cookie-parser");

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use('/api/users', require('./modules/users/user.routes.js'));
app.use('/api/routes', require('./modules/route/route.routes.js'));
app.use('/api/pollution', require('./modules/pollution/pollution.routes.js'));
app.use("/api/auth", require("./modules/auth/auth.routes"));

module.exports = app;
