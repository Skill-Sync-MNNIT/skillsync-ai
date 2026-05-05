import {
  TransactionalEmailsApi,
  AccountApi,
  TransactionalEmailsApiApiKeys,
  AccountApiApiKeys,
} from '@getbrevo/brevo';
import { otpTemplate } from './otpTemplate.js';

const apiInstance = new TransactionalEmailsApi();

apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// common sender
const sender = {
  name: 'SkillSync',
  email: process.env.BREVO_SENDER_EMAIL,
};

const accountInstance = new AccountApi();
accountInstance.setApiKey(AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY);

accountInstance.getAccount().then(
  () => console.log('Brevo Email Service Connected.'),
  (err) => console.error('Brevo Connection Error:', err.message)
);

export const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    const firstName = name?.trim()?.split(' ')[0] || 'User';

    const emailData = {
      sender,
      to: [{ email }],
      subject: 'Your Verification Code • SkillSync',
      textContent: `Hi ${firstName}, your SkillSync verification code is ${otp}. It expires in 10 minutes.`,
      htmlContent: otpTemplate(otp, firstName, 'verification'),
    };

    await apiInstance.sendTransacEmail(emailData);
    console.log('OTP email sent');
  } catch (error) {
    console.error('Brevo OTP error:', error?.response?.body || error);
  }
};

export const sendPasswordResetEmail = async (email, otp, name = 'User') => {
  try {
    const firstName = name?.trim()?.split(' ')[0] || 'User';

    const emailData = {
      sender,
      to: [{ email }],
      subject: 'Your Password Reset Code • SkillSync',
      textContent: `Hi ${firstName}, your SkillSync password reset code is ${otp}. It expires in 10 minutes.`,
      htmlContent: otpTemplate(otp, firstName, 'reset'),
    };

    await apiInstance.sendTransacEmail(emailData);
    console.log('Reset email sent');
  } catch (error) {
    console.error('Brevo reset error:', error?.response?.body || error);
  }
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await apiInstance.sendTransacEmail({
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    });
  } catch (error) {
    console.error('Brevo generic error:', error?.response?.body || error);
  }
};

export const sendJobRejectionEmail = async (email, jobTitle, violationType, banUntil) => {
  try {
    const banText = banUntil
      ? `restricted until ${new Date(banUntil).toLocaleDateString()}`
      : 'permanently restricted';

    const emailData = {
      sender,
      to: [{ email }],
      subject: 'Action Required: Your Job Posting was Rejected • SkillSync',
      textContent: `Your job "${jobTitle}" was rejected due to: ${violationType}. Your account is ${banText}.`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
          <h2 style="color: #e53e3e;">Job Rejection Notice</h2>
          <p>Hello,</p>
          <p>Your recent job posting "<strong>${jobTitle}</strong>" has been reviewed by our AI moderation system and was <strong>rejected</strong>.</p>
          
          <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #c53030;"><strong>Reason:</strong> ${violationType.replace(/_/g, ' ')}</p>
          </div>

          <p>As per our safety policy, your account has been <strong>${banText}</strong> from posting new jobs.</p>
          
          <p style="font-size: 0.9em; color: #718096; margin-top: 30px;">
            If you believe this was a mistake, please contact support at support@skillsync.ai
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8em; color: #a0aec0; text-align: center;">SkillSync AI • MNNIT Allahabad</p>
        </div>
      `,
    };

    await apiInstance.sendTransacEmail(emailData);
    console.log(`Rejection email sent to ${email}`);
  } catch (error) {
    console.error('Brevo rejection error:', error?.response?.body || error);
  }
};
