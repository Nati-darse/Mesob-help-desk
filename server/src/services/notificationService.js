const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Transporter for emails
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Twilio Client
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
) : null;

// @desc    Send Email Notification
exports.sendEmail = async (to, subject, text, html) => {
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
        console.log(`[Email Simulation] To: ${to}, Subject: ${subject}`);
        return;
    }

    try {
        await transporter.sendMail({
            from: `"Mesob Help Desk" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        });
    } catch (error) {
        console.error('Email Error:', error.message);
    }
};

// @desc    Send SMS Notification
exports.sendSMS = async (to, message) => {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
        console.log(`[SMS Simulation] To: ${to}, Message: ${message}`);
        return;
    }

    try {
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
        });
    } catch (error) {
        console.error('SMS Error:', error.message);
    }
};
