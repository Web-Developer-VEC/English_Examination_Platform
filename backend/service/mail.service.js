const { SendRawEmailCommand } = require("@aws-sdk/client-ses");
const { ses } = require("../config/ses");
const {
    getEmailTemplate
} = require("../html/studentReportMail");


const sendExamPDFEmail = async ({
    to,
    studentName,
    examTitle,
    questionCode, // <-- ADDED THIS
    questions = [], 
    pdfBuffer,
    filename
}) => {

    const boundary =
        `----=_NextPart_${Date.now()}`;


    // =========================================================
    // PDF BUFFER
    // =========================================================

    const nodeBuffer =
        Buffer.isBuffer(pdfBuffer)
            ? pdfBuffer
            : Buffer.from(pdfBuffer);


    const base64Data =
        nodeBuffer.toString("base64");


    // MIME requires line wrapping
    const formattedBase64 =
        (base64Data.match(/.{1,76}/g) || [])
            .join("\r\n");


    // =========================================================
    // EMAIL HTML
    // =========================================================

    const htmlTemplate =
        getEmailTemplate(
            studentName,
            examTitle,
            questionCode // <-- PASSED THIS TO TEMPLATE
        );


    // =========================================================
    // RAW EMAIL
    // =========================================================

    const emailBody = [

        `From: ${process.env.REPORT_MAIL}`,

        `To: ${to}`,

        // <-- UPDATED SUBJECT LINE TO INCLUDE QUESTION CODE
        `Subject: Examination Report - ${examTitle} ${questionCode}`,

        `MIME-Version: 1.0`,

        `Content-Type: multipart/mixed; boundary="${boundary}"`,

        ``,


        // =====================================================
        // HTML EMAIL
        // =====================================================

        `--${boundary}`,

        `Content-Type: text/html; charset=UTF-8`,

        `Content-Transfer-Encoding: 8bit`,

        ``,

        htmlTemplate,

        ``,


        // =====================================================
        // PDF ATTACHMENT
        // =====================================================

        `--${boundary}`,

        `Content-Type: application/pdf; name="${filename}"`,

        `Content-Disposition: attachment; filename="${filename}"`,

        `Content-Transfer-Encoding: base64`,

        ``,

        formattedBase64,

        ``,


        // =====================================================
        // END
        // =====================================================

        `--${boundary}--`,

        ``

    ].join("\r\n");


    // =========================================================
    // AWS SES COMMAND
    // =========================================================

    const command =
        new SendRawEmailCommand({

            RawMessage: {

                Data:
                    Buffer.from(
                        emailBody,
                        "utf-8"
                    )

            }

        });


    return await ses.send(command);
};


module.exports = {
    sendExamPDFEmail
};