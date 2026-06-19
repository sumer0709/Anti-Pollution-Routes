require("dotenv").config();
const app = require("./app");
const logger = require("./utils/logger.js");
const connectDb = require("./config/db.js");
const startScheduler = require('./cron/scheduler.js');

const PORT = process.env.PORT || 5000;

connectDb().then(() => {
    app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
    });
    startScheduler();
}).catch((error) => {
    logger.error('Failed to connect to the database', error);
    process.exit(1);
});