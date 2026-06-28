const amqplib = require("amqplib");
const logger = require("../utils/logger");

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  try {
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    logger.info("Connected to RabbitMQ");

    connection.on("error", (err) => {
      logger.error("RabbitMQ connection error", err);
      connection = null;
      channel = null;
    });

    connection.on("close", () => {
      logger.info("RabbitMQ connection closed");
      connection = null;
      channel = null;
    });

    return channel;
  } catch (error) {
    logger.error("Failed to connect to RabbitMQ", error);
    throw error;
  }
};

const getChannel = () => channel;

module.exports = {
  connectRabbitMQ,
  getChannel,
};
