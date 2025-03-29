const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// console.log("Loaded API key:", process.env.SENDGRID_API_KEY);


async function sendEmail({ to, subject, html }) {
  console.log("📬 Sending email to:", to); // Add this
  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject,
    html
  };
  try {
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

module.exports = sendEmail;

