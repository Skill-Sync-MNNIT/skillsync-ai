export const passwordResetTemplate = (otp, firstName) => {
  return `
    <div style="margin:0; padding:0; background:#f2f4f6; font-family: Arial, sans-serif;">
    
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden;">
        
        <!-- Blue Header -->
        <tr>
            <td style="background:#2563eb; padding:22px; text-align:center; color:#ffffff;">
            <h1 style="margin:0; font-size:22px;">SkillSync Password Reset</h1>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding:30px;">
            
            <h2 style="margin:0 0 15px; font-size:20px; color:#111;">
                Reset Your Password
            </h2>

            <p style="margin:0 0 15px; font-size:15px; color:#444;">
                Hi <strong>${firstName}</strong>,
            </p>

            <p style="margin:0 0 20px; font-size:15px; color:#555;">
                We received a request to reset your password. Use the following One-Time Password (OTP) to proceed:
            </p>

            <!-- OTP -->
            <div style="text-align:center; margin:25px 0;">
                <div style="display:inline-block; padding:16px 28px; font-size:28px; letter-spacing:6px; font-weight:bold; background:#eff6ff; border:2px solid #bfdbfe; border-radius:10px; color:#1d4ed8;">
                ${otp}
                </div>
            </div>

            <p style="margin:0 0 15px; font-size:14px; color:#555;">
                This code will expire in <strong>10 minutes</strong>.
            </p>

            <p style="margin:0 0 20px; font-size:13px; color:#888;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
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
