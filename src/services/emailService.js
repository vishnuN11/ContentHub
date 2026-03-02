import nodemailer from 'nodemailer';
import dns from 'dns';
import dotenv from 'dotenv';

// ✅ .env फाइल लोड करा - हे अत्यंत महत्त्वाचे आहे!
dotenv.config();

// फोर्स IPv4
dns.setDefaultResultOrder('ipv4first');

// ✅ Create transporter function
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const transporter = createTransporter();

// Test connection function
export const testEmailConnection = async () => {
  console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
  console.log("🔑 EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
  
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
};

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
export const sendOTPEmail = async (toEmail, otp) => {
  console.log("📧 Sending from:", process.env.EMAIL_USER);
  console.log("📧 Sending to:", toEmail);
  console.log("🔑 EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
  
  try {
    console.log(`📧 Sending OTP to ${toEmail}...`);
    
    const mailOptions = {
      from: `"ContentHub" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your OTP for Registration - ContentHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .otp-box { background: #f0f4ff; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; color: #667eea; border-radius: 10px; margin: 20px 0; letter-spacing: 10px; border: 2px dashed #667eea; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>ContentHub</h1></div>
            <div class="content">
              <h2>Welcome to ContentHub!</h2>
              <p>Your OTP for registration is:</p>
              <div class="otp-box">${otp}</div>
              <p>This OTP is valid for <strong>10 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ContentHub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Email send error:', error);
    
    if (error.code === 'EAUTH') {
      return { 
        success: false, 
        error: 'Authentication failed. Please check your Gmail App Password.' 
      };
    }
    
    if (error.code === 'ESOCKET') {
      return { 
        success: false, 
        error: 'Connection error. Please check your network and firewall settings.' 
      };
    }
    
    return { success: false, error: error.message };
  }
};