import nodemailer from 'nodemailer';
import { otpTemplate } from './otpTemplate.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify connection when server starts
transporter.verify((error) => {
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
      html: otpTemplate(otp, firstName, 'verification'),
    });
  } catch (error) {
    console.error('Failed to send OTP email', error);
    // throw new Error("Failed to send OTP email");
  }
};

export const sendPasswordResetEmail = async (email, otp, name = 'User') => {
  try {
    const safeName = name?.trim() || 'User';
    const firstName = safeName.split(' ')[0];

    await transporter.sendMail({
      from: `"SkillSync" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Password Reset Code • SkillSync',
      text: `Hi ${firstName}, your SkillSync password reset code is ${otp}. It expires in 10 minutes.`,
      html: otpTemplate(otp, firstName, 'reset'),
    });
  } catch (error) {
    console.error('Failed to send password reset email', error);
    // throw new Error("Failed to send password reset email");
  }
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await transporter.sendMail({
      from: `"SkillSync" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Failed to send generic email', error);
  }
};
