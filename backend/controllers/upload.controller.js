const Busboy = require("busboy");
const { uploadToS3 } = require("../service/s3_service");

const uploadHTMLToS3 = (req, res) => {
    try {
        const busboy = Busboy({
            headers: req.headers
        });

        let fileData = null;
        let folder = null;

        // Get folder from form-data
        busboy.on("field", (fieldname, value) => {
            if (fieldname === "folder") {
                folder = value;
            }
        });

        // Get file from form-data
        busboy.on("file", (fieldname, file, info) => {
            const { filename, mimeType } = info;

            const chunks = [];

            file.on("data", (chunk) => {
                chunks.push(chunk);
            });

            file.on("end", () => {
                fileData = {
                    buffer: Buffer.concat(chunks),
                    filename,
                    mimeType
                };
            });
        });

        busboy.on("finish", async () => {
            try {
                if (!fileData) {
                    return res.status(400).json({
                        success: false,
                        message: "No file uploaded"
                    });
                }

                if (!folder) {
                    return res.status(400).json({
                        success: false,
                        message: "Folder name is required"
                    });
                }

                const result = await uploadToS3(
                    fileData,
                    folder
                );

                return res.status(200).json(result);

            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        req.pipe(busboy);

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    uploadHTMLToS3
};