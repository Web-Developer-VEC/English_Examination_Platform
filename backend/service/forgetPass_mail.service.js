const { SendRawEmailCommand } = require("@aws-sdk/client-ses");
const { ses } = require("../config/ses");

async function sendOtpEmail({ to, otp }) {
  const boundary = `----=_NextPart_${Date.now()}`;

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
</head>

<body style="
    margin:0;
    padding:0;
    background-color:#f3f4f6;
    font-family:Arial, Helvetica, sans-serif;
    color:#333333;
">

    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        border="0"
        style="
            width:100%;
            background-color:#f3f4f6;
        "
    >

        <tr>
            <td align="center" style="padding:35px 10px;">

                <!-- MAIN CONTAINER -->

                <table
                    role="presentation"
                    width="650"
                    cellspacing="0"
                    cellpadding="0"
                    border="0"
                    style="
                        width:100%;
                        max-width:650px;
                        background-color:#ffffff;
                        border-radius:8px;
                        overflow:hidden;
                        box-shadow:0 8px 30px rgba(0,0,0,0.12);
                    "
                >

                    <!-- =========================
                         VELAMMAL HEADER
                    ========================== -->

                    <tr>
                        <td
                            align="center"
                            style="
                                background-color:#ffffff;
                                padding:20px 20px 10px;
                            "
                        >

                            <img
          src="https://velammal.edu.in/static/media/NEWLOGO.0a50cf7beb701e4ade9f.png"
                                alt="Velammal Engineering College Logo"
                                width="72"
                                style="
                                    display:block;
                                    width:72px;
                                    height:auto;
                                    margin:0 auto 8px;
                                "
                            >

                            <div
                                style="
                                    color:#5b2b1f;
                                    font-family:Georgia, 'Times New Roman', serif;
                                    font-size:28px;
                                    font-weight:500;
                                    letter-spacing:1px;
                                    line-height:1.1;
                                "
                            >
                                VELAMMAL
                            </div>

                            <div
                                style="
                                    margin-top:5px;
                                    color:#3d2a24;
                                    font-family:Georgia, 'Times New Roman', serif;
                                    font-size:16px;
                                    font-weight:500;
                                    letter-spacing:1.5px;
                                "
                            >
                                ENGINEERING COLLEGE
                            </div>

                            <div
                                style="
                                    margin-top:6px;
                                    color:#444444;
                                    font-family:Georgia, 'Times New Roman', serif;
                                    font-size:13px;
                                    font-style:italic;
                                "
                            >
                                The Wheel of Knowledge rolls on!
                            </div>

                            <div
                                style="
                                    margin-top:3px;
                                    color:#777777;
                                    font-family:Georgia, 'Times New Roman', serif;
                                    font-size:12px;
                                    font-style:italic;
                                "
                            >
                                (An Autonomous Institution)
                            </div>

                        </td>
                    </tr>


                    <!-- YELLOW LINE -->

                    <tr>
                        <td
                            style="
                                height:5px;
                                background-color:#f4c400;
                            "
                        >
                        </td>
                    </tr>


                    <!-- =========================
                         OTP TITLE
                    ========================== -->

                    <tr>
                        <td
                            align="center"
                            style="
                                background-color:#fafafa;
                                padding:28px 25px;
                                border-bottom:1px solid #eeeeee;
                            "
                        >

                            <div
                                style="
                                    color:#a36f00;
                                    font-size:11px;
                                    font-weight:bold;
                                    letter-spacing:2px;
                                    margin-bottom:8px;
                                "
                            >
                                SECURITY VERIFICATION
                            </div>

                            <div
                                style="
                                    margin:0;
                                    color:#7b0f1c;
                                    font-size:23px;
                                    font-weight:700;
                                    line-height:1.4;
                                "
                            >
                                OTP VERIFICATION
                            </div>

                        </td>
                    </tr>


                    <!-- =========================
                         CONTENT
                    ========================== -->

                    <tr>
                        <td
                            style="
                                padding:32px 38px;
                                color:#555555;
                                font-size:15px;
                                line-height:1.7;
                            "
                        >

                            <p style="margin-top:0;">
                                Dear User,
                            </p>

                            <p>
                                We received a request to reset your password for the
                                <strong style="color:#7b0f1c;">
                                    English Examination Platform
                                </strong>.
                            </p>

                            <p>
                                Please use the following One-Time Password (OTP)
                                to continue with your password reset.
                            </p>


                            <!-- =========================
                                 OTP BOX
                            ========================== -->

                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                style="
                                    margin:25px 0;
                                    background-color:#fffaf0;
                                    border-left:4px solid #f4c400;
                                    border-radius:5px;
                                "
                            >

                                <tr>
                                    <td
                                        align="center"
                                        style="
                                            padding:25px 20px;
                                        "
                                    >

                                        <div
                                            style="
                                                color:#7b0f1c;
                                                font-size:12px;
                                                font-weight:bold;
                                                letter-spacing:1.5px;
                                                margin-bottom:12px;
                                            "
                                        >
                                            YOUR OTP CODE
                                        </div>


                                        <div
                                            style="
                                                display:inline-block;
                                                padding:12px 22px;
                                                background-color:#ffffff;
                                                border:1px solid #e5d5b5;
                                                border-radius:6px;
                                                color:#7b0f1c;
                                                font-size:34px;
                                                font-weight:bold;
                                                letter-spacing:8px;
                                            "
                                        >
                                            ${otp}
                                        </div>

                                    </td>
                                </tr>

                            </table>


                            <!-- INFO BOX -->

                            <table
                                role="presentation"
                                width="100%"
                                cellspacing="0"
                                cellpadding="0"
                                border="0"
                                style="
                                    margin-top:25px;
                                    background-color:#f8f8f8;
                                    border-left:4px solid #7b0f1c;
                                "
                            >

                                <tr>
                                    <td
                                        style="
                                            padding:16px 18px;
                                            color:#555555;
                                            font-size:14px;
                                            line-height:1.6;
                                        "
                                    >

                                        <strong style="color:#7b0f1c;">
                                            Important:
                                        </strong>

                                        Your OTP is valid for
                                        <strong>10 minutes</strong>.

                                        <br><br>

                                        Do not share this OTP with anyone.
                                        If you did not request a password reset,
                                        you can safely ignore this email.

                                    </td>
                                </tr>

                            </table>


                            <p style="margin-top:30px;">

                                Thank you,

                                <br><br>

                                <strong style="color:#333333;">
                                    English Department
                                    <br>
                                    Velammal Engineering College
                                </strong>

                            </p>

                        </td>
                    </tr>


                    <!-- =========================
                         FOOTER
                    ========================== -->

                    <tr>
                        <td
                            align="center"
                            style="
                                background-color:#f7f7f7;
                                padding:25px 20px;
                                border-top:4px solid #f4c400;
                            "
                        >

                            <div
                                style="
                                    margin-bottom:15px;
                                    color:#666666;
                                    font-size:12px;
                                    line-height:1.7;
                                "
                            >

                                Velammal Engineering College (Autonomous)

                                <br>

                                Ambattur – Red Hills Road, Surapet,

                                <br>

                                Chennai – 600 066, Tamil Nadu, India

                            </div>


                            <div
                                style="
                                    border-top:1px solid #dddddd;
                                    width:75%;
                                    margin:15px auto;
                                "
                            >
                            </div>


                            <div
                                style="
                                    color:#777777;
                                    font-size:12px;
                                "
                            >

                                &copy;

                                <a
                                    href="https://velammal.edu.in/webteam"
                                    target="_blank"
                                    style="
                                        color:#7b0f1c;
                                        font-weight:bold;
                                        text-decoration:none;
                                    "
                                >
                                    WebOps VEC
                                </a>

                                , Velammal Engineering College, Chennai

                            </div>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>

    </table>

</body>

</html>
`;

  // =========================================================
  // RAW EMAIL
  // =========================================================

  const emailBody = [
    `From: English Department - VEC <${process.env.REPORT_MAIL}>`,
    `To: ${to}`,
    `Subject: OTP Verification - English Examination Platform`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,

    // TEXT VERSION
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    `VELAMMAL ENGINEERING COLLEGE`,
    `English Examination Platform`,
    ``,
    `OTP VERIFICATION`,
    ``,
    `Your OTP is: ${otp}`,
    ``,
    `This OTP is valid for 10 minutes.`,
    `Do not share this OTP with anyone.`,
    ``,
    `© WebOps VEC, Velammal Engineering College, Chennai`,
    ``,

    // HTML VERSION
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    htmlTemplate,
    ``,

    // END
    `--${boundary}--`,
    ``,
  ].join("\r\n");

  // =========================================================
  // AWS SES COMMAND
  // =========================================================

  const command = new SendRawEmailCommand({
    RawMessage: {
      Data: Buffer.from(emailBody, "utf-8"),
    },
  });

  // =========================================================
  // SEND EMAIL
  // =========================================================

  return await ses.send(command);
}

module.exports = {
  sendOtpEmail,
};
