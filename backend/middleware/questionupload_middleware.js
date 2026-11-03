const Busboy = require("busboy");
const { parseBuffer } = require("music-metadata");
const { uploadToS3 } = require("../service/s3.service");

const questions_upload_Middleware = (req, res, next) => {
  const contentType = req.headers["content-type"];

  if (!contentType || !contentType.includes("multipart/form-data")) {
    return res.status(400).json({
      success: false,
      message: "Content-Type must be multipart/form-data",
      error: "Content-Type must be multipart/form-data",
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
      const buffer = Buffer.concat(chunks);

      req.files[fieldname] = {
        fieldname,
        filename: info.filename,
        mimeType: info.mimeType,
        size: buffer.length,
        buffer,
      };
    });
  });

  busboy.on("finish", async () => {
    try {
      const { questionCode, type } = req.body;
      const { audio, questions, passageFile } = req.files;
      const examType = String(type || "audio").trim().toLowerCase();

      if (!questionCode || !questionCode.trim()) {
        return res.status(400).json({
          success: false,
          message: "questionCode is required",
          error: "questionCode is required",
        });
      }

      if (!questions) {
        return res.status(400).json({
          success: false,
          message: "Questions Excel file is required",
          error: "Questions Excel file is required",
        });
      }

      if (examType === "comprehension") {
        let passage = (req.body.passage || "").trim();

        // If a passage file (.txt or .md) was uploaded, read text from buffer
        if (!passage && passageFile && passageFile.buffer) {
          passage = passageFile.buffer.toString("utf-8").trim();
        }

        if (!passage) {
          return res.status(400).json({
            success: false,
            message: "Reading passage / paragraph text is required for comprehension exam.",
            error: "Reading passage / paragraph text is required for comprehension exam.",
          });
        }

        req.uploadedData = {
          questionCode: questionCode.trim(),
          type: "comprehension",
          passage,
          audio: null,
          audioDurationMinutes: 0,
        };

        return next();
      }

      // Default: Audio Listening Comprehension
      if (!audio) {
        return res.status(400).json({
          success: false,
          message: "Audio file is required for audio examination.",
          error: "Audio file is required for audio examination.",
        });
      }

      // Get audio duration
      const metadata = await parseBuffer(
        audio.buffer,
        {
          mimeType: audio.mimeType,
          filename: audio.filename,
        }
      );

      // Duration is returned in seconds
      const audioDurationMinutes = metadata.format.duration
        ? Number((metadata.format.duration / 60).toFixed(2))
        : 0;

      console.log("Audio Duration:", audioDurationMinutes, "minutes");

      // Upload audio to S3
      const uploadedAudio = await uploadToS3(
        audio,
        `questions/${questionCode.trim()}`,
      );

      req.uploadedData = {
        questionCode: questionCode.trim(),
        type: "audio",
        audio: uploadedAudio,
        audioDurationMinutes,
        passage: null,
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
