
const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { ses } = require("../config/ses");

const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const command = new SendEmailCommand({
      Source: process.env.EMAIL_FROM,

      Destination: {
        ToAddresses: [email],
      },

      Message: {
        Subject: {
          Data: "AWS SES Test Email 🚀",
          Charset: "UTF-8",
        },

        Body: {
          Html: {
            Data: `
              <h1>Hello 👋</h1>
              <p>AWS SES is working successfully!</p>
            `,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await ses.send(command);

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: response.MessageId,
    });

  } catch (error) {
    console.error("SES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { sendTestEmail };