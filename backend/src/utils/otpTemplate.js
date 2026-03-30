export const otpTemplate = (otp, firstName, type = 'verification') => {
  const isReset = type === 'reset';

  const config = {
    headerColor: isReset ? '#4f46e5' : '#16a34a', // Indigo for reset, Green for verification
    title: isReset ? 'SkillSync Password Reset' : 'SkillSync Account Verification',
    subtitle: isReset ? 'Reset Your Password' : 'Verify Your Email',
    message: isReset
      ? 'We received a request to reset your password. Use the following One-Time Password (OTP) to proceed:'
      : 'Use the following One-Time Password (OTP) to complete your verification:',
    footerDescription: isReset
      ? 'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.'
      : 'If you did not request this verification, you can safely ignore this email.',
    otpStyle: isReset
      ? 'background:#eef2ff; border:2px solid #c7d2fe; color:#4338ca;'
      : 'background:#f1f3f5; border:none; color:#111;',
  };

  return `
    <div style="margin:0; padding:0; background:#f2f4f6; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden;">
        
        <!-- Header -->
        <tr>
            <td style="background:${config.headerColor}; padding:22px; text-align:center; color:#ffffff;">
            <h1 style="margin:0; font-size:22px;">${config.title}</h1>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding:30px;">
            
            <h2 style="margin:0 0 15px; font-size:20px; color:#111;">
                ${config.subtitle}
            </h2>

            <p style="margin:0 0 15px; font-size:15px; color:#444;">
                Hi <strong>${firstName}</strong>,
            </p>

            <p style="margin:0 0 20px; font-size:15px; color:#555;">
                ${config.message}
            </p>

            <!-- OTP -->
            <div style="text-align:center; margin:25px 0;">
                <div style="display:inline-block; padding:16px 28px; font-size:28px; letter-spacing:6px; font-weight:bold; border-radius:10px; ${config.otpStyle}">
                ${otp}
                </div>
            </div>

            <p style="margin:0 0 15px; font-size:14px; color:#555;">
                This code will expire in <strong>10 minutes</strong>.
            </p>

            <p style="margin:0 0 20px; font-size:13px; color:#888;">
                ${config.footerDescription}
            </p>

            <hr style="border:none; border-top:1px solid #eee; margin:25px 0;" />
            
            <p style="margin:10px 0 0; font-size:12px; color:#aaa; text-align:center;">
                This is an automated message from SkillSync. Please do not reply.
            </p>

            </td>
        </tr>

        </table>
    </div>
  `;
};
