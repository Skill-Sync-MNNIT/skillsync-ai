export const otpTemplate = (otp, firstName) => {
  return `
    <div style="margin:0; padding:0; background:#f2f4f6; font-family: Arial, sans-serif;">
    
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden;">
        
        <!-- Green Header -->
        <tr>
            <td style="background:#16a34a; padding:22px; text-align:center; color:#ffffff;">
            <h1 style="margin:0; font-size:22px;">SkillSync Verification</h1>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding:30px;">
            
            <h2 style="margin:0 0 15px; font-size:20px; color:#111;">
                Verify Your Email
            </h2>

            <p style="margin:0 0 15px; font-size:15px; color:#444;">
                Hi <strong>${firstName}</strong>,
            </p>

            <p style="margin:0 0 20px; font-size:15px; color:#555;">
                Use the following One-Time Password (OTP) to complete your verification:
            </p>

            <!-- OTP -->
            <div style="text-align:center; margin:25px 0;">
                <div style="display:inline-block; padding:16px 28px; font-size:28px; letter-spacing:6px; font-weight:bold; background:#f1f3f5; border-radius:10px;">
                ${otp}
                </div>
            </div>

            <p style="margin:0 0 15px; font-size:14px; color:#555;">
                This code will expire in <strong>10 minutes</strong>.
            </p>

            <p style="margin:0 0 20px; font-size:13px; color:#888;">
                If you did not request this verification, you can safely ignore this email.
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
