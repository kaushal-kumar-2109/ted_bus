const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

// Create transport using Gmail service as requested
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD 
  }
});

/**
 * Send an email
 * @param {Object} options - { to, subject, text, html }
 */
const sendEmail = async ({ to, subject, text, html, attachments }) => {
  try {
    const info = await transporter.sendMail({
      from: `"RedBus Platform" <${process.env.SMTP_USER || 'kaushal21092003kumar@gmail.com'}>`,
      to,
      subject,
      text,
      html: html || text,
      attachments: attachments || [],
    });
    console.log("✉️ Email sent successfully: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email delivery failed:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
