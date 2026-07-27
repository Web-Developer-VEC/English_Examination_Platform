const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3");

/**
 * Upload a file to AWS S3
 *
 * @param {Object} file
 * @param {Buffer} file.buffer
 * @param {String} file.filename
 * @param {String} file.mimeType
 * @param {String} folder
 * @returns {Object}
 */
const uploadToS3 = async (file, folder) => {

    try {

        const key = `english_exam_platform/${folder}/${Date.now()}-${file.filename}`;

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimeType
        });

        await s3Client.send(command);

        return {
            success: true,
            key,
            url: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
        };

    } catch (error) {

        throw new Error(`S3 Upload Failed: ${error.message}`);

    }

};

module.exports = {
    uploadToS3
};