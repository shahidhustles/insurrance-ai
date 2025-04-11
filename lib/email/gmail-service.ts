import nodemailer from "nodemailer";

/**
 * Creates a Nodemailer transporter using SendGrid or Gmail
 */
async function createMailTransporter() {
  try {
    // Try SendGrid first if configured (preferred method for production)
    if (process.env.SENDGRID_API_KEY) {
      console.log("Creating mail transporter with SendGrid");

      // Create SendGrid transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false, // TLS
        auth: {
          user: "apikey", // this is literally the string 'apikey'
          pass: process.env.SENDGRID_API_KEY,
        },
      });

      // Verify the transporter
      await transporter.verify();
      console.log("Mail transporter verified successfully with SendGrid");

      return transporter;
    }

    
    throw new Error(
      "No email service credentials are configured. "
    );
  } catch (error) {
    console.error("Error creating mail transporter:", error);
    throw new Error(
      `Failed to initialize email service: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Sends an email using SendGrid or Gmail
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
  cc,
  bcc,
}: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}) {
  if (!to || !subject || !text) {
    throw new Error("Missing required fields: to, subject, or text");
  }

  let attempts = 0;
  const maxAttempts = 3;
  let lastError= null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      // Get app name from env or use default
      const appName = process.env.APP_NAME || "Insurance AI";

      console.log(
        `Email attempt ${attempts}/${maxAttempts} to ${Array.isArray(to) ? to.join(", ") : to}`
      );

      // Create a new transporter for each attempt
      const transporter = await createMailTransporter();

      // Determine from address
      let fromEmail = process.env.GMAIL_USER;
      if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
        fromEmail = process.env.SENDGRID_FROM_EMAIL;
      }

      if (!fromEmail) {
        throw new Error(
          "No sender email configured. Set SENDGRID_FROM_EMAIL or GMAIL_USER."
        );
      }

      const mailOptions = {
        from: `${appName} <${fromEmail}>`,
        to,
        subject,
        text,
        html,
        replyTo,
        cc,
        bcc,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log(
        `Email sent successfully to ${Array.isArray(to) ? to.join(", ") : to}, messageId: ${result.messageId}`
      );

      return {
        success: true,
        messageId: result.messageId,
        provider: process.env.SENDGRID_API_KEY ? "sendgrid" : "gmail",
      };
    } catch (error) {
      lastError = error;
      console.error(`Email attempt ${attempts} failed:`, error);

      // If this was the last attempt, throw the error
      if (attempts >= maxAttempts) {
        break;
      }

      // Wait before retrying (increasing delay with each attempt)
      const delayMs = 1000 * attempts;
      console.log(`Retrying in ${delayMs / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // If we're here, all attempts failed
  throw new Error(
    `Failed to send email after ${attempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
