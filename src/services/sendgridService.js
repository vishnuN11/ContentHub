// server/src/services/sendgridService.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// SendGrid API Key सेट करा
if (!process.env.SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY is missing in environment variables');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('🔑 SendGrid API Key configured');
}

/**
 * Generate a random OTP
 * @param {string} type - 'numeric' (default), 'alphanumeric', 'alphabet'
 * @param {number} length - OTP length (default: 6)
 * @returns {string} OTP
 */
export const generateOTP = (type = 'numeric', length = 6) => {
  let otp = '';
  const characters = {
    numeric: '0123456789',
    alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  };
  
  const charSet = characters[type] || characters.numeric;
  
  for (let i = 0; i < length; i++) {
    otp += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  
  return otp;
};

/**
 * Send OTP Email using SendGrid
 * @param {string} toEmail - Recipient's email address
 * @param {string} otp - One Time Password
 * @param {string} organization - Organization name (default: 'ContentHub')
 * @returns {Promise<object>} Success status and message ID
 */
export const sendOTPEmail = async (toEmail, otp, organization = 'ContentHub') => {
  try {
    console.log(`📧 Sending OTP to ${toEmail} via SendGrid...`);

    const msg = {
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL, // तुझा verified sender email
      subject: `Your OTP for ${organization}`,
      text: `Your OTP for registration is: ${otp}. This OTP is valid for 10 minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; }
            .otp-box { background: #f0f4ff; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; color: #667eea; border-radius: 10px; margin: 20px 0; letter-spacing: 10px; border: 2px dashed #667eea; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${organization}</h1>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>Your one-time password (OTP) for verification is:</p>
              <div class="otp-box">${otp}</div>
              <p>This OTP is valid for <strong>10 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${organization}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send email using SendGrid
    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully via SendGrid');
    console.log('📧 Message ID:', response[0]?.headers['x-message-id']);
    
    return { 
      success: true, 
      messageId: response[0]?.headers['x-message-id'],
      statusCode: response[0]?.statusCode 
    };
    
  } catch (error) {
    console.error('❌ SendGrid email error:');
    
    // SendGrid specific error handling [citation:1][citation:3]
    if (error.response) {
      console.error('Status Code:', error.response.status);
      console.error('Response Body:', error.response.body);
      
      // Specific error messages based on status code
      if (error.response.status === 401) {
        return { 
          success: false, 
          error: 'Invalid API key. Please check your SendGrid API key.' 
        };
      }
      if (error.response.status === 403) {
        return { 
          success: false, 
          error: 'Sender email not verified. Please verify your sender identity in SendGrid.' 
        };
      }
      return { 
        success: false, 
        error: `SendGrid error (${error.response.status}): ${error.response.body?.errors?.[0]?.message || 'Unknown error'}` 
      };
    }
    
    // Network or other errors
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Test SendGrid connection
 * @returns {Promise<boolean>} Connection status
 */
export const testSendGridConnection = async () => {
  try {
    // Send a test email to yourself
    const result = await sendOTPEmail(
      process.env.SENDGRID_FROM_EMAIL, 
      '123456', 
      'Test'
    );
    return result.success;
  } catch (error) {
    console.error('❌ SendGrid connection test failed:', error);
    return false;
  }
};