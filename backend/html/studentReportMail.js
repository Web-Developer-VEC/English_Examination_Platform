const getEmailTemplate = (studentName, examTitle, questionCode) => {
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
       REPORT TITLE
    ========================== */

    .report-section {
      background-color: #fafafa;
      text-align: center;
      padding: 28px 25px;
      border-bottom: 1px solid #eeeeee;
    }

    .report-label {
      color: #a36f00;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }

    .report-title {
      margin: 0;
      color: #7b0f1c;
      font-size: 23px;
      font-weight: 700;
      line-height: 1.4;
    }


    /* =========================
       EMAIL CONTENT
    ========================== */

    .content {
      padding: 32px 38px;
    }

    .content p {
      font-size: 15px;
      line-height: 1.7;
      color: #555555;
    }

    .student-name {
      color: #7b0f1c;
      font-weight: bold;
    }


    /* =========================
       ATTACHMENT BOX
    ========================== */

    .attachment-box {
      margin: 25px 0;
      padding: 20px;
      background-color: #fffaf0;
      border-left: 4px solid #f4c400;
      border-radius: 5px;
    }

    .attachment-title {
      margin: 0 0 8px;
      color: #7b0f1c;
      font-size: 16px;
      font-weight: bold;
    }

    .attachment-text {
      margin: 0;
      color: #555555;
      font-size: 14px;
      line-height: 1.6;
    }


    /* =========================
       INFORMATION BOX
    ========================== */

    .info-box {
      margin-top: 25px;
      padding: 16px 18px;
      background-color: #f8f8f8;
      border-left: 4px solid #7b0f1c;
    }

    .info-box p {
      margin: 0;
      font-size: 14px;
    }


    /* =========================
       FOOTER
    ========================== */

    .footer {
      background-color: #f7f7f7;
      text-align: center;
      padding: 25px 20px;
      border-top: 4px solid #f4c400;
    }

    .footer-address {
      margin: 0 0 15px;
      color: #666666;
      font-size: 12px;
      line-height: 1.7;
    }

    .footer-divider {
      border: none;
      border-top: 1px solid #dddddd;
      width: 75%;
      margin: 15px auto;
    }

    .footer-reference {
      margin: 0;
      color: #777777;
      font-size: 12px;
    }

.webops-link {
      color: #800000 !important; /* Dark Red */
      font-weight: bold;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .webops-link:hover {
      color: #f4c400 !important; /* Yellow hover effect */
    }

    .copyright {
      margin-top: 12px;
      color: #999999;
      font-size: 11px;
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

        <!-- Replace with your actual hosted logo URL -->

        <img
          class="header-logo"
          src="https://velammal.edu.in/static/media/NEWLOGO.0a50cf7beb701e4ade9f.png"
          alt="Velammal Engineering College Logo"
        >

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
          ${examTitle || "English Laboratory Test Report"} - ${questionCode || "N/A"}
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


        <p>
          Your test report for <strong>${examTitle || "English Laboratory Test"}</strong> 
          (Code: <strong>${questionCode || "N/A"}</strong>) has been successfully generated.
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
              ${examTitle || "English Laboratory Test Report"} ${questionCode || "N/A"}
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
