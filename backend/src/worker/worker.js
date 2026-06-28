require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { connectRabbitMQ, getChannel } = require("../config/rabbitmq");
const { POLLUTION_QUEUE } = require("../config/queue");
const {
  calculatePollutionScore,
} = require("../modules/pollution/pollution.service");
const logger = require("../utils/logger");
const connectDb = require("../config/db");

const startWorker = async () => {
  await connectDb();
  await connectRabbitMQ();
  const channel = await getChannel();

  await channel.assertQueue(POLLUTION_QUEUE, { durable: true });
  channel.prefetch(1);
  logger.info("Worker started");
  channel.consume(POLLUTION_QUEUE, async (msg) => {
    if (!msg) {
      return;
    }
    try {
      const { routeId } = JSON.parse(msg.content.toString());
      logger.info(`Processing route ${routeId}`);
      await calculatePollutionScore(routeId);
      channel.ack(msg);
    } catch (error) {
      logger.error(`Error processing route ${routeId}`, error);
      channel.nack(msg, false, true);
    }
  });
};

startWorker().catch((error) => {
  logger.error("Worker failed to start", error);
  process.exit(1);
});
