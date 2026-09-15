const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

// --- OAuth2 Client Setup ---
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER;
// ----------------------------



class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: EMAIL_USER,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 10,
    });

    this.verifyTransporter();
  }

  async verifyTransporter() {
    try {
      await this.transporter.verify();
      console.log("Gmail OAuth2 transporter is ready");
    } catch (error) {
     
    console.error("Gmail OAuth2 transporter failed:");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Response:", error.response);
    console.error("ResponseCode:", error.responseCode);
    console.error(error);

    }
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  getEmailStyles() {
    return `
      <style>
        /* Base Reset */
        body, p, h1, h2, h3, div { margin: 0; padding: 0; }
        body { 
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
          background-color: #ffffff; 
          color: #333333; 
          line-height: 1.6;
        }
        
        /* Containers */
        .wrapper { width: 100%; background-color: #ffffff; padding: 0; }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff; 
        }

        /* Header (The Red Angled Look) */
        .header {
          background-color: #ff444f; /* Uzinduzi Red */
          padding: 40px 20px;      /* Increased padding */
          text-align: center;      /* ✅ CENTER ALIGNMENT */
        }
        .header img {
          height: 70px;            /* ✅ BIGGER LOGO */
          width: auto;
          display: inline-block;
        }

        /* Content Body */
        .content { padding: 40px; text-align: center; }
        h2.title { font-size: 22px; font-weight: bold; color: #333333; margin-bottom: 10px; }
        p.text { font-size: 16px; color: #333333; margin-bottom: 20px; }
        
        /* The Red Button (Pill Shape) */
        .btn {
          display: inline-block;
          background-color: #ff444f;
          color: #ffffff !important;
          padding: 14px 30px;
          font-size: 16px;
          font-weight: bold;
          text-decoration: none;
          border-radius: 50px; /* Pill shape */
          margin: 20px 0;
        }
        
        /* Gray Box for OTP/Links */
        .gray-box {
          background-color: #f2f2f2;
          padding: 20px;
          border-radius: 4px;
          margin: 20px 0;
          text-align: center;
          word-break: break-all;
        }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333333; }
        .link-text { font-size: 12px; color: #0056b3; text-decoration: underline; }

        /* Footer & Socials */
        .footer { padding: 30px 40px; text-align: center; border-top: 1px solid #eeeeee; }
        .social-icons { margin-bottom: 20px; }
        .social-icon { 
          display: inline-block; 
          width: 24px; 
          height: 24px; 
          margin: 0 8px; 
          text-decoration: none;
        }
        .social-icon img { width: 100%; height: auto; border: 0; }
        .legal-text { font-size: 11px; color: #999999; line-height: 1.5; }
        .contact-link { color: #ff444f; text-decoration: none; font-weight: bold; }
        
        /* Footer Links */
        .footer-link { color: #ff444f; text-decoration: none; margin: 0 5px; }
      </style>
    `;
  }

  getEmailHeader() {
    const logoUrl =
      process.env.EMAIL_LOGO_URL ||
      "https://uzinduziafrica.com/wp-content/uploads/2025/11/Uzinduzi_White_logo.jpeg";
    return `
      <div class="header">
         <img src="${logoUrl}" alt="Uzinduzi Africa">
      </div>
    `;
  }

  getEmailFooter() {
    const icons = {
      fb: "https://cdn-icons-png.flaticon.com/512/20/20673.png",
      x: "https://cdn-icons-png.flaticon.com/512/5969/5969020.png",
      li: "https://cdn-icons-png.flaticon.com/512/3536/3536505.png",
      insta: "https://cdn-icons-png.flaticon.com/512/1384/1384063.png",
      tiktok: "https://cdn-icons-png.flaticon.com/512/3046/3046121.png",
      wa: "https://cdn-icons-png.flaticon.com/512/1384/1384055.png",
    };

    return `
      <div class="footer">
        <p class="text" style="font-size: 14px; margin-bottom: 20px;">
          If you didn't request this, <a href="https://uzinduziafrica.com/" class="contact-link">contact us</a>.
        </p>
        
        <div class="social-icons">
          <a href="https://www.facebook.com/UzinduziAfrica" class="social-icon"><img src="${
            icons.fb
          }" alt="Facebook"></a>
          <a href="https://www.instagram.com/uzinduziafricaofficial/" class="social-icon"><img src="${
            icons.insta
          }" alt="Instagram"></a>
          <a href="https://twitter.com/UzinduziAfrica" class="social-icon"><img src="${
            icons.x
          }" alt="X"></a>
          <a href="https://www.linkedin.com/company/uzinduzi-africa/" class="social-icon"><img src="${
            icons.li
          }" alt="LinkedIn"></a>
          <a href="https://www.tiktok.com/@uzinduziafrica" class="social-icon"><img src="${
            icons.tiktok
          }" alt="TikTok"></a>
          <a href="https://wa.link/n4d1vj" class="social-icon"><img src="${
            icons.wa
          }" alt="WhatsApp"></a>
        </div>

        <p class="legal-text">
          Uzinduzi Africa is a registered platform for African Music promotion.<br>
          Harare, Zimbabwe.<br>
          &copy; ${new Date().getFullYear()} Uzinduzi Africa. All rights reserved.
          <br><br>
          <a href="https://uzinduziafrica.com/" class="footer-link">Home</a> | 
          <a href="https://uzinduziafrica.com/terms-of-service/" class="footer-link">Terms and conditions</a> | 
          <a href="https://uzinduziafrica.com/privacy-policy-2/" class="footer-link">Security and privacy</a>
        </p>
        
        <div style="margin-top: 20px; font-weight: bold; color: #ff444f; font-size: 18px;">
            uzinduzi
        </div>
      </div>
    `;
  }

 async sendEmail(mailOptions) {
  // Always log the OTP to the terminal for dev visibility
  const otpMatch = mailOptions.html?.match(
    /<span class="otp-code"[^>]*>(\d{6})<\/span>/
  );
  if (otpMatch) {
    console.log(`\n🔐 OTP for ${mailOptions.to}: ${otpMatch[1]}\n`);
  }

  try {
    console.log(` Sending email to ${mailOptions.to}...`);
    const info = await this.transporter.sendMail(mailOptions);
    console.log(` Email sent successfully. ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`FAILED to send email:`, error.message);
    return false;
  }
}

  async sendOTPEmail(to, otp, name = "") {
    const mailOptions = {
      from: `"Uzinduzi Africa" <${EMAIL_USER}>`,
      to: to,
      subject: "Verify your email",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.getEmailStyles()}</head>
        <body>
          <div class="wrapper">
            <div class="container">
              ${this.getEmailHeader()}
              <div class="content">
                <h2 class="title">Verify your email address</h2>
                <p class="text">Hi ${
                  name || "there"
                }, let's get you verified.</p>
                <p class="text">Use the following code to complete your registration:</p>
                <div class="gray-box">
                  <span class="otp-code">${otp}</span>
                </div>
                <p class="text" style="font-size: 12px; color: #999;">This code expires in 10 minutes.</p>
              </div>
              ${this.getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
    };
    return this.sendEmail(mailOptions);
  }

  async sendPasswordResetOTPEmail(to, otp, name = "") {
    const mailOptions = {
      from: `"Uzinduzi Africa" <${EMAIL_USER}>`,
      to: to,
      subject: "Reset your password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.getEmailStyles()}</head>
        <body>
          <div class="wrapper">
            <div class="container">
              ${this.getEmailHeader()}
              <div class="content">
                <h2 class="title">Forgot your password? Let's get you a new one.</h2>
                <p class="text">Use the One-Time Password (OTP) below to reset your password:</p>
                <div class="gray-box">
                    <span class="otp-code">${otp}</span>
                </div>
                <p class="text">Alternatively, click the button below to verify:</p>
                <a href="#" class="btn">Reset my password</a>
                <p class="text" style="margin-top: 20px;">
                  If the button doesn't work, you can copy and paste the code above into the app.
                </p>
                <div class="gray-box" style="text-align: left; font-size: 12px; color: #555;">
                   <strong style="display:block; margin-bottom:5px;">Security Note:</strong>
                   If you didn't request a password reset, your account may be compromised. Contact support immediately.
                </div>
              </div>
              ${this.getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
    };
    return this.sendEmail(mailOptions);
  }

  async sendWelcomeEmail(to, name = "") {
    const mailOptions = {
      from: `"Uzinduzi Africa" <${EMAIL_USER}>`,
      to: to,
      subject: "Welcome to Uzinduzi Africa! ",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.getEmailStyles()}</head>
        <body>
          <div class="wrapper">
            <div class="container">
              ${this.getEmailHeader()}
              <div class="content">
                <h2 class="title">Welcome, ${name || "Music Lover"}!</h2>
                <p class="text">You are now part of Africa's premier music music lifestyle platform.</p>
                <a href="https://app.uzinduziafrica.com" class="btn">Start Exploring</a>
                <div class="gray-box" style="text-align: left;">
                  <p style="margin-bottom: 10px;"><strong>Get started:</strong></p>
                  <ul style="padding-left: 20px; margin: 0;">
                    <li> Discover and support your favourite artists</li>
                                       <li>Build your loyalt library</li>
                  </ul>
                </div>
              </div>
              ${this.getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
    };
    return this.sendEmail(mailOptions);
  }

  // 4. Admin Login OTP
  async sendAdminLoginOTPEmail(to, otp, adminName, adminEmail) {
    const mailOptions = {
      from: `"Uzinduzi Security" <${EMAIL_USER}>`,
      to: to,
      subject: "Admin Login Attempt",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.getEmailStyles()}</head>
        <body>
          <div class="wrapper">
            <div class="container">
              ${this.getEmailHeader()}
              <div class="content">
                <h2 class="title">Admin Login Verification</h2>
                <p class="text">An admin login attempt requires your approval.</p>
                <div class="gray-box" style="text-align: left;">
                  <p><strong>User:</strong> ${adminName}</p>
                  <p><strong>Email:</strong> ${adminEmail}</p>
                </div>
                <p class="text">Your verification code:</p>
                <div style="background-color: #fff0f0; padding: 15px; border-radius: 50px; display: inline-block;">
                    <span class="otp-code" style="color: #ff444f;">${otp}</span>
                </div>
              </div>
              ${this.getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
    };
    return this.sendEmail(mailOptions);
  }
 /**
   * ✅ ADDED: Used by authService.requestAdminCreationOTP
   */
  async sendAccountCreationOTPEmail(to, otp, newAdminName, newAdminEmail) {
    return this.sendEmail({
      from: `"Uzinduzi Security" <${EMAIL_USER}>`,
      to,
      subject: "Admin Account Creation Verification",
      html: `<!DOCTYPE html><html><head>${this.getEmailStyles()}</head><body>
        <div class="wrapper"><div class="container">
          ${this.getEmailHeader()}
          <div class="content">
            <h2 class="title">Approve Admin Account Creation</h2>
            <p class="text">A request to create a new admin account has been made.</p>
            <div class="gray-box" style="text-align:left;">
              <p><strong>New Admin Name:</strong> ${newAdminName}</p>
              <p><strong>New Admin Email:</strong> ${newAdminEmail}</p>
            </div>
            <p class="text">Use this OTP to approve the account creation:</p>
            <div class="gray-box"><span class="otp-code">${otp}</span></div>
            <p class="text" style="font-size:12px;color:#999;">This code expires in 10 minutes.</p>
          </div>
          ${this.getEmailFooter()}
        </div></div></body></html>`,
    });
  }
  async sendLoginReminder(to, username) {
    const mailOptions = {
      from: `"Uzinduzi Africa Support" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "Login Help: Use your email to sign in",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.getEmailStyles()}</head>
        <body>
          <div class="wrapper">
            <div class="container">
              ${this.getEmailHeader()}
              <div class="content">
                <h2 class="title">Trouble logging in?</h2>
                <p class="text">Hi ${username},</p>
                <p class="text">We noticed you might be having trouble accessing your account. No worries!</p>
                
                <div class="gray-box" style="text-align: left;">
                  <p><strong>Tip:</strong> You can log in using your email address instead of your username.</p>
                  <p><strong>Email:</strong> ${to}</p>
                </div>

                <a href="https://app.uzinduziafrica.com/login" class="btn">Go to Login</a>
              </div>
              ${this.getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
    };
    return this.sendEmail(mailOptions);
  }

  // --- NEW: Send Verification/Re-signup Instructions ---
  async sendVerificationFix(to, username, otp) {
    // Construct the verification link (adjust base URL as needed)
    const verifyLink = `https://app.uzinduziafrica.com/verify-email"?email=${encodeURIComponent(
      to
    )}&otp=${otp}`;
    const signupLink = `https://app.uzinduziafrica.com/register`;

    const mailOptions = {
      from: `"Uzinduzi Africa Support" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "Action Required: Verify your account",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.getEmailStyles()}</head>
        <body>
          <div class="wrapper">
            <div class="container">
              ${this.getEmailHeader()}
              <div class="content">
                <h2 class="title">Complete your setup</h2>
                <p class="text">Hi ${username},</p>
                <p class="text">It looks like your account was created but never verified. You have two options:</p>
                
                <div style="text-align: left; margin: 20px 0;">
                  <h3 style="color: #ff444f;">Option 1: Verify this account</h3>
                  <p class="text">If you just need to finish signing up, use this code or link:</p>
                  <div class="gray-box">
                    <span class="otp-code">${otp}</span>
                  </div>
                  <p style="text-align: center;">
                    <a href="${verifyLink}" class="link-text" style="font-size: 16px;">Click here to verify directly</a>
                  </p>
                </div>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

                <div style="text-align: left;">
                  <h3 style="color: #333;">Option 2: Start Over</h3>
                  <p class="text">If you prefer to create a brand new account, you can do so here:</p>
                  <p style="text-align: center;">
                    <a href="${signupLink}" style="color: #ff444f; font-weight: bold; text-decoration: underline;">Create New Account</a>
                  </p>
                </div>
              </div>
              ${this.getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
    };
    return this.sendEmail(mailOptions);
  }

  // ✅ NEW: Send Transaction Failed Email
  async sendTransactionFailedEmail(to, username, transaction) {
    const { referenceNumber, amount, currency, albumName, createdAt } =
      transaction;
    const date = new Date(createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const mailOptions = {
      from: `"Uzinduzi Payments" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Action Required: Transaction Failed (${referenceNumber})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${this.getEmailStyles()}</head>
        <body>
          <div class="wrapper">
            <div class="container">
              ${this.getEmailHeader()}
              <div class="content">
                <h2 class="title" style="color: #dc2626;">Transaction Failed</h2>
                <p class="text">Hi ${username},</p>
                <p class="text">We noticed a failed transaction on your account. If this payment was successful on your end, please contact us immediately so we can update your status.</p>
                
                <div class="gray-box" style="text-align: left;">
                  <p><strong>Reference:</strong> ${referenceNumber}</p>
                  <p><strong>Item:</strong> ${albumName || "Album Purchase"}</p>
                  <p><strong>Amount:</strong> ${amount} ${currency}</p>
                  <p><strong>Date:</strong> ${date}</p>
                </div>

                <p class="text">
                  Please reply to this email with your proof of payment if you believe this is an error.
                </p>
                
                <a href="mailto:admin@uzinduziafrica.com?subject=Payment Query: ${referenceNumber}" class="btn">Contact Admin</a>
              </div>
              ${this.getEmailFooter()}
            </div>
          </div>
        </body>
        </html>
      `,
    };
    return this.sendEmail(mailOptions);
  }
}

module.exports = new EmailService();
