const { PutObjectCommand } = require("@aws-sdk/client-s3");
const {s3} = require("../config/s3");

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

        const key = `english_exam_platform/${folder}/${file.filename}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimeType
        });

        await s3.send(command);

        return {
            success: true,
            key,
            url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
        };

    } catch (error) {

        throw new Error(`S3 Upload Failed: ${error.message}`);

    }

};

module.exports = {
    uploadToS3
};