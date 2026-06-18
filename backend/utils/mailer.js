const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "465");
const isSecure = smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD 
  },
  connectionTimeout: 10000, // 10 seconds timeout
  greetingTimeout: 10000,
  socketTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Send an email
 * @param {Object} options - { to, subject, text, html }
 */
const sendEmail = async ({ to, subject, text, html, attachments }) => {
  const resendApiKey = process.env.RESEND_API || process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log("📨 Sending email via Resend HTTP API...");
      const resendPayload = {
        from: process.env.MAIL_FROM || "RedBus Platform <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || text,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content.toString("base64") : att.content
        }))
      };

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(resendPayload)
      });

      const data = await response.json();
      if (response.ok) {
        console.log("✉️ Email sent successfully via Resend HTTP API: %s", data.id);
        return { success: true, messageId: data.id };
      } else {
        console.error("❌ Resend HTTP API error:", data);
      }
    } catch (httpError) {
      console.error("❌ Resend HTTP API failed, falling back to SMTP/other APIs:", httpError);
    }
  }

  // 2. SendGrid HTTP API Fallback (Bypasses Render SMTP port block over port 443)
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log("📨 Sending email via SendGrid HTTP API...");
      const sendGridPayload = {
        personalizations: [
          {
            to: (Array.isArray(to) ? to : [to]).map(email => ({ email: email.trim() }))
          }
        ],
        from: {
          email: process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || "kaushal21092003kumar@gmail.com",
          name: process.env.MAIL_FROM_NAME || "RedBus Platform"
        },
        subject,
        content: [
          {
            type: "text/html",
            value: html || text
          }
        ],
        attachments: attachments?.map(att => ({
          content: Buffer.isBuffer(att.content) ? att.content.toString("base64") : att.content,
          filename: att.filename,
          type: att.contentType || "application/octet-stream",
          disposition: "attachment"
        }))
      };

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sendGridPayload)
      });

      if (response.ok) {
        console.log("✉️ Email sent successfully via SendGrid HTTP API");
        return { success: true };
      } else {
        const data = await response.json().catch(() => ({}));
        console.error("❌ SendGrid HTTP API error:", data);
      }
    } catch (httpError) {
      console.error("❌ SendGrid HTTP API failed, falling back to SMTP/other APIs:", httpError);
    }
  }

  // 3. Brevo HTTP API Fallback (Bypasses Render SMTP port block over port 443)
  if (process.env.BREVO_API_KEY) {
    try {
      console.log("📨 Sending email via Brevo HTTP API...");
      const brevoPayload = {
        sender: {
          name: process.env.MAIL_FROM_NAME || "RedBus Platform",
          email: process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || "kaushal21092003kumar@gmail.com"
        },
        to: (Array.isArray(to) ? to : [to]).map(email => ({ email: email.trim() })),
        subject,
        htmlContent: html || text,
        attachment: attachments?.map(att => ({
          content: Buffer.isBuffer(att.content) ? att.content.toString("base64") : att.content,
          name: att.filename
        }))
      };

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(brevoPayload)
      });

      const data = await response.json();
      if (response.ok) {
        console.log("✉️ Email sent successfully via Brevo HTTP API: %s", data.messageId);
        return { success: true, messageId: data.messageId };
      } else {
        console.error("❌ Brevo HTTP API error:", data);
      }
    } catch (httpError) {
      console.error("❌ Brevo HTTP API failed, falling back to SMTP:", httpError);
    }
  }

  // 4. Standard SMTP connection (Requires Render to unblock SMTP ports)
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
    console.error("❌ Email delivery failed (SMTP):", error);
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout') || error.message?.includes('CONN')) {
      console.error(
        "\n========================================================================\n" +
        "⚠️ DIAGNOSTIC: SMTP CONNECTION TIMEOUT DETECTED\n" +
        "This is usually caused by hosting providers (like Render or Heroku) blocking outbound SMTP ports (25, 465, 587) to prevent spam.\n\n" +
        "TO SOLVE THIS:\n" +
        "1. Option A (Recommended & Easiest): Set up a free account on Resend (resend.com), Brevo (brevo.com), or SendGrid (sendgrid.com).\n" +
        "   Add one of the following environment variables to your Render service:\n" +
        "   - RESEND_API_KEY\n" +
        "   - SENDGRID_API_KEY\n" +
        "   - BREVO_API_KEY\n" +
        "   This mailer will automatically switch to the HTTP API (port 443) which is NOT blocked.\n\n" +
        "2. Option B: Contact Render support and request they unblock SMTP ports for your service.\n" +
        "========================================================================\n"
      );
    }
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
