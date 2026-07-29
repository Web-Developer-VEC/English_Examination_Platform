const Busboy = require("busboy");
const { uploadToS3 } = require("../service/s3_service");

const student_upload_Middleware = (req, res, next) => {

    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
        return res.status(400).json({
            success: false,
            message: "Content-Type must be multipart/form-data"
        });
    }

    const busboy = Busboy({
        headers: req.headers
    });

    req.files = {};


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

            const { student_data } = req.files;
            if (!student_data) {
                return res.status(400).json({
                    success: false,
                    message: "Student Excel file is required."
                });
            }

            const uploadedStudentFile = await uploadToS3(
                student_data,
                "student"
            );

            req.uploadedData = {
                student_data: uploadedStudentFile,
                file: student_data
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

module.exports = student_upload_Middleware;