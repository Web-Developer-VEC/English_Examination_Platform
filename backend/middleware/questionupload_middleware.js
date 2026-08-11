const Busboy = require("busboy");
const { uploadToS3 } = require("../service/s3_service");

const questions_upload_Middleware = (req, res, next) => {

    const contentType = req.headers["content-type"];

    if (!contentType || !contentType.includes("multipart/form-data")) {
        return res.status(400).json({
            success: false,
            message: "Content-Type must be multipart/form-data"
        });
    }

    const busboy = Busboy({ headers: req.headers });

    req.body = {};
    req.files = {};

    busboy.on("field", (name, value) => {
        req.body[name] = value;
    });

    busboy.on("file", (fieldname, file, info) => {

        const chunks = [];

        file.on("data", (chunk) => {
            chunks.push(chunk);
        });

        file.on("end", () => {

            req.files[fieldname] = {
                fieldname,
                filename: info.filename,
                mimeType: info.mimeType,
                size: Buffer.concat(chunks).length,
                buffer: Buffer.concat(chunks)
            };

        });

    });

    busboy.on("finish", async () => {

        try {

            const { questionCode } = req.body;
            const { audio, questions } = req.files;

            if (!questionCode) {
                return res.status(400).json({
                    success: false,
                    message: "questionCode is required"
                });
            }

            if (!audio) {
                return res.status(400).json({
                    success: false,
                    message: "Audio file is required"
                });
            }

            if (!questions) {
                return res.status(400).json({
                    success: false,
                    message: "Questions file is required"
                });
            }

            // Upload audio to S3
            const uploadedAudio = await uploadToS3(
                audio,
                `questions/${questionCode}`
            );

            // Upload questions file to S3
            const uploadedQuestions = await uploadToS3(
                questions,
                `questions/${questionCode}`
            );

            req.uploadedData = {
                questionCode,
                audio: uploadedAudio,
                questions: uploadedQuestions
            };

            next();

        } catch (error) {
            next(error);
        }

    });

    busboy.on("error", (err) => {
        next(err);
    });

    req.pipe(busboy);
};

module.exports = questions_upload_Middleware;