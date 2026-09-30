const getEmailTemplate = (studentName, examTitle, questionCode, isMalpractice = false) => {
  return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>

    /* =========================
       GLOBAL
    ========================== */

    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: Arial, Helvetica, sans-serif;
      color: #333333;
    }

    .email-wrapper {
      width: 100%;
      padding: 35px 10px;
    }

    .container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }


    /* =========================
       VELAMMAL HEADER
    ========================== */

    .header {
      background-color: #ffffff;
      text-align: center;
      padding: 18px 20px 8px;
    }

    .header-logo {
      width: 72px;
      height: auto;
      display: block;
      margin: 0 auto 6px;
    }

    .college-title-main {
      margin: 0;
      color: #5b2b1f;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 28px;
      font-weight: 500;
      letter-spacing: 1px;
      line-height: 1.1;
    }

    .college-title-sub {
      margin: 4px 0 0;
      color: #3d2a24;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .college-motto {
      margin: 4px 0 0;
      color: #444444;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 13px;
      font-style: italic;
    }

    .autonomous-text {
      margin: 2px 0 0;
      color: #777777;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12px;
      font-style: italic;
    }

    .header-line {
      height: 5px;
      width: 100%;
      background-color: #f4c400;
      margin-top: 8px;
    }


    /* =========================
       REPORT SECTION
    ========================== */

    .report-section {
      text-align: center;
      padding: 22px 20px 15px;
      background-color: #ffffff;
    }

    .report-label {
      display: inline-block;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #5b2b1f;
      background-color: #fdf3d8;
      padding: 4px 14px;
      border-radius: 20px;
      border: 1px solid #f4c400;
    }

    .report-title {
      margin: 10px 0 0;
      color: #1a1a1a;
      font-size: 20px;
      font-weight: 600;
    }


    /* =========================
       CONTENT
    ========================== */

    .content {
      padding: 10px 30px 25px;
      font-size: 14px;
      line-height: 1.6;
      color: #444444;
    }

    .student-name {
      font-weight: 600;
      color: #1a1a1a;
    }

    .attachment-box {
      background-color: #fcfcfc;
      border: 1px solid #e5e7eb;
      border-left: 4px solid #f4c400;
      border-radius: 4px;
      padding: 14px 16px;
      margin: 20px 0;
    }

    .attachment-title {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .attachment-text {
      margin: 0;
      font-size: 13px;
      color: #555555;
    }

    .info-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 12px 16px;
      margin: 15px 0 20px;
      font-size: 13px;
      color: #666666;
    }

    .info-box p {
      margin: 0;
    }


    /* =========================
       FOOTER
    ========================== */

    .footer {
      background-color: #fafafa;
      border-top: 1px solid #eeeeee;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #888888;
      line-height: 1.5;
    }

    .footer p {
      margin: 4px 0;
    }

    .footer-divider {
      margin: 8px auto;
      width: 40px;
      height: 1px;
      background-color: #dddddd;
    }

    .footer-dept {
      color: #5b2b1f;
      font-weight: 600;
    }


    /* =========================
       MOBILE
    ========================== */

    @media only screen and (max-width: 600px) {

      .email-wrapper {
        padding: 15px 5px;
      }

      .container {
        border-radius: 4px;
      }

      .content {
        padding: 25px 20px;
      }

      .college-title-main {
        font-size: 24px;
      }

      .college-title-sub {
        font-size: 14px;
      }

      .report-title {
        font-size: 20px;
      }

    }

  </style>

</head>


<body>

  <div class="email-wrapper">

    <div class="container">


      <!-- =========================
           COLLEGE HEADER
      ========================== -->

      <div class="header">

        <img
          class="header-logo"
          src="https://www.testeng.site/assets/college-logo-D-j6Zg0N.png"
          alt="Velammal Logo"
        />

        <h1 class="college-title-main">
          VELAMMAL
        </h1>

        <div class="college-title-sub">
          ENGINEERING COLLEGE
        </div>

        <p class="college-motto">
          The Wheel of Knowledge rolls on!
        </p>

        <p class="autonomous-text">
          (An Autonomous Institution)
        </p>

      </div>

      <div class="header-line"></div>


      <!-- =========================
           REPORT TITLE
      ========================== -->

      <div class="report-section">

        <div class="report-label">
          EXAMINATION REPORT
        </div>

        <h2 class="report-title">
          ${examTitle || "English Laboratory Test Report"} (${questionCode || "N/A"})
        </h2>

      </div>


      <!-- =========================
           EMAIL CONTENT
      ========================== -->

      <div class="content">

        <p>
          Dear
          <span class="student-name">
            ${studentName || "Student"}
          </span>,
        </p>

        ${
          isMalpractice
            ? `
        <div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 6px; padding: 14px 18px; margin: 15px 0; text-align: center;">
          <div style="color: #991b1b; font-weight: bold; font-size: 15px; letter-spacing: 0.5px;">⚠️ MALPRACTICE DETECTED — CANDIDATE DISQUALIFIED</div>
          <div style="color: #b91c1c; font-size: 12px; margin-top: 5px;">This examination session was terminated and recorded as malpractice due to security violations. Assessment result is marked as Disqualified.</div>
        </div>
        `
            : ""
        }


        <p>
          Your test report for <strong>${examTitle || "English Laboratory Test"}</strong> 
          (Question Code: <strong>${questionCode || "N/A"}</strong>) has been successfully generated.
        </p>


        <p>
          Please find your detailed examination report attached to this email
          for your reference.
        </p>


        <!-- PDF ATTACHMENT -->

        <div class="attachment-box">

          <div class="attachment-title">
            📄 Examination Report Attached
          </div>

          <p class="attachment-text">

            Your detailed
            <strong>
              ${examTitle || "English Laboratory Test Report"} (${questionCode || "N/A"})
            </strong>
            is attached as a PDF document.

          </p>

        </div>


        <!-- INFORMATION -->

        <div class="info-box">

          <p>

            Please review your report carefully. If you have any questions
            or require clarification regarding your results, kindly contact
            your department coordinator.

          </p>

        </div>


        <p style="margin-top:30px;">

          Thank you,
          <br><br>

          <strong>
            English Department
            <br>
            Velammal Engineering College
          </strong>

        </p>

      </div>


      <!-- =========================
           FOOTER
      ========================== -->

      <div class="footer">

        <p class="footer-address">

          Velammal Engineering College (Autonomous)
          <br>

          Ambattur – Red Hills Road, Surapet,
          <br>

          Chennai – 600 066, Tamil Nadu, India

        </p>


        <hr class="footer-divider">


        <p class="footer-reference">

          &copy;

          <a
            href="https://velammal.edu.in/webteam"
            target="_blank"
            class="webops-link"
          >
            WebOps VEC
          </a>

          , Velammal Engineering College, Chennai

        </p>


      </div>


    </div>

  </div>

</body>

</html>
`.replace(/\n/g, "\r\n");
};

module.exports = {
  getEmailTemplate,
};
