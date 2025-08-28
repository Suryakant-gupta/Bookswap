const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

  }

  async sendOTP(email, otp, name = 'User') {
    const mailOptions = {
      from: `"BookSwap Marketplace" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your BookSwap Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>BookSwap Verification Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; border: 2px dashed #4F46E5; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 BookSwap Marketplace</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for joining BookSwap Marketplace! To complete your registration, please use the verification code below:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This code will expire in 10 minutes</li>
                <li>Use this code only on the BookSwap website</li>
                <li>Never share this code with anyone</li>
              </ul>
              
              <p>If you didn't request this code, please ignore this email.</p>
              
              <p>Happy book swapping!</p>
              <p><strong>The BookSwap Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 BookSwap Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('OTP email sent successfully', { 
        email, 
        messageId: result.messageId 
      });
      return true;
    } catch (error) {
      logger.error('Error sending OTP email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendRequestNotification(ownerEmail, requesterName, bookTitle, message) {
    const mailOptions = {
      from: `"BookSwap Marketplace" <${process.env.SMTP_USER}>`,
      to: ownerEmail,
      subject: `New Book Request: ${bookTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Book Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .book-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10B981; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📖 New Book Request!</h1>
            </div>
            <div class="content">
              <h2>Someone wants your book!</h2>
              
              <div class="book-info">
                <h3>Book: "${bookTitle}"</h3>
                <p><strong>Requester:</strong> ${requesterName}</p>
                ${message ? `<p><strong>Message:</strong> "${message}"</p>` : ''}
              </div>
              
              <p>Log in to your BookSwap account to accept or decline this request.</p>
              
              <p>Happy book sharing!</p>
              <p><strong>The BookSwap Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 BookSwap Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Request notification email sent successfully', { 
        ownerEmail, 
        bookTitle,
        messageId: result.messageId 
      });
      return true;
    } catch (error) {
      logger.error('Error sending request notification email:', error);
      // Don't throw error as this is not critical
      return false;
    }
  }

  async sendRequestAccepted(requesterEmail, requesterName, bookTitle, ownerName, responseMessage) {
    const mailOptions = {
      from: `"BookSwap Marketplace" <${process.env.SMTP_USER}>`,
      to: requesterEmail,
      subject: `Great News! Your Book Request Was Accepted: ${bookTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Request Accepted</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .book-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10B981; }
            .success-badge { background-color: #10B981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Request Accepted!</h1>
            </div>
            <div class="content">
              <h2>Hello ${requesterName}!</h2>
              
              <div class="success-badge">✅ ACCEPTED</div>
              
              <p>Great news! Your book request has been accepted!</p>
              
              <div class="book-info">
                <h3>Book: "${bookTitle}"</h3>
                <p><strong>Book Owner:</strong> ${ownerName}</p>
                ${responseMessage ? `<p><strong>Owner's Message:</strong> "${responseMessage}"</p>` : ''}
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Log in to your BookSwap account to view contact details</li>
                <li>Coordinate with ${ownerName} to arrange the book exchange</li>
                <li>Mark the request as completed once you receive the book</li>
              </ul>
              
              <p>Happy reading!</p>
              <p><strong>The BookSwap Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 BookSwap Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Request accepted email sent successfully', { 
        requesterEmail, 
        bookTitle,
        messageId: result.messageId 
      });
      return true;
    } catch (error) {
      logger.error('Error sending request accepted email:', error);
      return false;
    }
  }

  async sendRequestDeclined(requesterEmail, requesterName, bookTitle, ownerName, responseMessage) {
    const mailOptions = {
      from: `"BookSwap Marketplace" <${process.env.SMTP_USER}>`,
      to: requesterEmail,
      subject: `Book Request Update: ${bookTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Request Declined</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6B7280; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .book-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #6B7280; }
            .declined-badge { background-color: #6B7280; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
            .encouragement { background-color: #EFF6FF; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3B82F6; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Request Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${requesterName}!</h2>
              
              <div class="declined-badge">❌ DECLINED</div>
              
              <p>We wanted to let you know that your book request was not accepted this time.</p>
              
              <div class="book-info">
                <h3>Book: "${bookTitle}"</h3>
                <p><strong>Book Owner:</strong> ${ownerName}</p>
                ${responseMessage ? `<p><strong>Owner's Message:</strong> "${responseMessage}"</p>` : ''}
              </div>
              
              <div class="encouragement">
                <h3>Don't give up! 📖</h3>
                <p>There are many other books available on BookSwap. Keep browsing and you'll find your next great read!</p>
                <ul>
                  <li>Check out other copies of the same book</li>
                  <li>Explore similar books by the same author</li>
                  <li>Browse books in the same genre</li>
                </ul>
              </div>
              
              <p>Keep swapping and happy reading!</p>
              <p><strong>The BookSwap Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 BookSwap Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Request declined email sent successfully', { 
        requesterEmail, 
        bookTitle,
        messageId: result.messageId 
      });
      return true;
    } catch (error) {
      logger.error('Error sending request declined email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: `"BookSwap Marketplace" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to BookSwap Marketplace!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to BookSwap</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .feature-list { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 Welcome to BookSwap!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Congratulations! Your BookSwap account has been successfully created and verified.</p>
              
              <div class="feature-list">
                <h3>What you can do now:</h3>
                <ul>
                  <li>📖 Browse thousands of books available for swap</li>
                  <li>➕ Add your own books to the marketplace</li>
                  <li>💬 Connect with other book lovers</li>
                  <li>🔄 Start swapping books with fellow readers</li>
                </ul>
              </div>
              
              <p>Ready to start your book swapping journey? Log in to your account and explore!</p>
              
              <p>Happy reading and swapping!</p>
              <p><strong>The BookSwap Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 BookSwap Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Welcome email sent successfully', { 
        email, 
        messageId: result.messageId 
      });
      return true;
    } catch (error) {
      logger.error('Error sending welcome email:', error);
      return false;
    }
  }

  async sendPasswordResetOTP(email, otp, name = 'User') {
    const mailOptions = {
      from: `"BookSwap Marketplace" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your BookSwap Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Code</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EF4444; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #EF4444; text-align: center; margin: 20px 0; padding: 15px; background-color: white; border-radius: 8px; border: 2px dashed #EF4444; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>We received a request to reset your BookSwap password. Use the code below to proceed:</p>
              
              <div class="otp-code">${otp}</div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This code will expire in 10 minutes</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this code with anyone</li>
              </ul>
              
              <p>For your security, make sure you're on the official BookSwap website when entering this code.</p>
              
              <p><strong>The BookSwap Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 BookSwap Marketplace. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Password reset OTP email sent successfully', { 
        email, 
        messageId: result.messageId 
      });
      return true;
    } catch (error) {
      logger.error('Error sending password reset OTP email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

module.exports = new EmailService();