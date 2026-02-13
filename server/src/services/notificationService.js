const nodemailer = require('nodemailer');
const twilio = require('twilio');
const {
    getSmtpSettingsSync,
    isEmailNotificationsEnabled,
    isSmsNotificationsEnabled,
    isCriticalAlertsEnabled
} = require('../utils/settingsCache');

const buildTransporter = (smtp) => {
    if (smtp && smtp.host) {
        return nodemailer.createTransport({
            host: smtp.host,
            port: Number(smtp.port) || 587,
            secure: Boolean(smtp.secure),
            auth: smtp.user ? { user: smtp.user, pass: smtp.pass || '' } : undefined,
        });
    }
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Twilio Client
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
) : null;

// @desc    Send Email Notification
exports.sendEmail = async (to, subject, text, html) => {
    if (!isEmailNotificationsEnabled()) {
        return;
    }
    const smtp = getSmtpSettingsSync();
    const smtpUser = smtp?.user || process.env.SMTP_USER;
    if (!smtpUser || smtpUser === 'your_email@gmail.com') {
        console.log(`[Email Simulation] To: ${to}, Subject: ${subject}`);
        return;
    }

    try {
        const transporter = buildTransporter(smtp);
        await transporter.sendMail({
            from: `"Mesob Help Desk" <${smtpUser}>`,
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
exports.sendSMS = async (to, message, options = {}) => {
    if (!isSmsNotificationsEnabled()) {
        return;
    }
    if (options.isCritical && !isCriticalAlertsEnabled()) {
        return;
    }
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
