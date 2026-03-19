import nodemailer from 'nodemailer';
import { otpTemplate } from './otpTemplate.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Optional: verify connection when server starts
transporter.verify((error) => {
  //we can remove this function just check to see if the email server is working
  if (error) {
    console.error('Email server error:', error);
  } else {
    console.log('Email server ready');
  }
});

export const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    const safeName = name?.trim() || 'User';
    const firstName = safeName.split(' ')[0];

    await transporter.sendMail({
      from: `"SkillSync" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code • SkillSync',
      text: `Hi ${firstName}, your SkillSync verification code is ${otp}. It expires in 10 minutes.`,
      html: otpTemplate(otp, firstName),
    });
  } catch (error) {
    console.error('Failed to send OTP email', error);
    // throw new Error("Failed to send OTP email");
  }
};
