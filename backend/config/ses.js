const { SESClient } = require("@aws-sdk/client-ses");

require("dotenv").config();

const region = process.env.AWS_REGION;

const ses = new SESClient({
  region,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = { ses };