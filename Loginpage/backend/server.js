// File: backend/server.js

const express = require('express');
const cors = require('cors');
const SibApiV3Sdk = require('@getbrevo/brevo');

// --- CONFIGURATION ---
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const BREVO_API_KEY = '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';
const BREVO_TEMPLATE_ID = 1; // This should be a number, not a string

// --- Brevo API setup ---
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = BREVO_API_KEY;

// Temporary storage for OTPs. In a real app, use a database.
const otpStorage = {};

// --- API ENDPOINT TO SEND OTP ---
app.post('/send-otp', (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const expiration = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes

    // Store the OTP and its expiration time
    otpStorage[email] = { otp, expiration };
    console.log(`Generated OTP for ${email}: ${otp}`);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.templateId = BREVO_TEMPLATE_ID;
    sendSmtpEmail.params = { otp: otp };

    apiInstance.sendTransacEmail(sendSmtpEmail).then(data => {
        console.log('Brevo API called successfully.');
        res.json({ success: true, message: 'OTP sent successfully!' });
    }).catch(error => {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to send OTP.' });
    });
});

// --- API ENDPOINT TO VERIFY OTP ---
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const storedData = otpStorage[email];

    if (!storedData) {
        return res.status(400).json({ success: false, message: 'OTP not found. Please try again.' });
    }

    if (Date.now() > storedData.expiration) {
        delete otpStorage[email]; // Clean up expired OTP
        return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    if (storedData.otp === otp) {
        delete otpStorage[email]; // OTP is used, so delete it
        return res.json({ success: true, message: 'OTP verified successfully!' });
    } else {
        return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
});


// --- START THE SERVER ---
app.listen(PORT, () => {
    console.log(`✅ Backend server is running on http://localhost:${PORT}`);
});