const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "like_post",
        "comment_post",
        "reply_comment",
        "follow",
        "mention",
        "verification_approved",
        "verification_rejected",
        "post_featured",
        "content_moderated",
        "booking_confirmed",
        "booking_cancelled",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // e.g. /posts/:id
    entityType: {
      type: String,
      enum: ["post", "comment", "user", "booking", "thread", "forum", null],
    },
    entityId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Compound index for user's unread notifications
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-expire notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Post-save hook to automatically send email copies of notifications to users
notificationSchema.post("save", async function (doc) {
  try {
    const User = mongoose.model("User");
    const recipientUser = await User.findById(doc.recipient);
    if (recipientUser && recipientUser.email) {
      const { sendEmail } = require("../utils/mailer");
      console.log(`✉️ Sending email copy of notification to: ${recipientUser.email}`);
      sendEmail({
        to: recipientUser.email,
        subject: `New Notification: ${doc.title}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 16px;">
            <h2 style="color: #d02b2b; text-align: center;">🔔 New Notification</h2>
            <p>Hello ${recipientUser.firstName || 'User'},</p>
            <p>You have received a new notification in your RedBus Clone account:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d02b2b;">
              <strong style="font-size: 16px;">${doc.title}</strong>
              <p style="margin: 5px 0 0 0; color: #555;">${doc.message}</p>
            </div>
            <p>To view it on the portal, click the button below:</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:4200'}${doc.link || '/'}" style="background-color: #d02b2b; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 8px;">View Notification</a>
            </div>
          </div>
        `
      }).catch(err => {
        console.error("Error sending notification email copy:", err);
      });
    }
  } catch (err) {
    console.error("Error in notification post-save email dispatch hook:", err);
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
