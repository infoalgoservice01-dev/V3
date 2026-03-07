import nodemailer from 'nodemailer';

// Nodemailer SMTP transport — uses Gmail App Password or any SMTP provider.
// If SMTP_HOST is not set, runs in simulation mode (emails printed to console only).
const mockTransporter = {
    sendMail: async (mailOptions: any) => {
        console.log(`📧 [EMAIL SIM] TO: ${mailOptions.to} | SUBJECT: ${mailOptions.subject}`);
        await new Promise(r => setTimeout(r, 200));
        return { messageId: 'simulated_send' };
    }
};

let transporter: any = mockTransporter;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('[EMAIL] ✅ Nodemailer SMTP initialized.');
} else {
    console.log('[EMAIL] ℹ️  No SMTP config found. Running in simulation mode.');
}

const FROM = process.env.SMTP_FROM || '"Leader A1 Fleet System" <noreply@leadera1.com>';

export const sendReminderEmail = async (to: string, driverName: string, days: number): Promise<boolean> => {
    try {
        const mailOptions = {
            from: FROM,
            to,
            subject: `⚠️ Action Required: ELD Profile Form ${days}+ Days Overdue`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #e11d48;">Profile Form Update Required</h2>
                    <p>Hi <strong>${driverName}</strong>,</p>
                    <p>Your ELD profile form has <strong>not been updated in over ${days} days</strong>.</p>
                    <p>Please log into the ELD system immediately to update your profile form and maintain compliance.</p>
                    <br/>
                    <p style="color: #64748b; font-size: 0.875rem;">This is an automated message from the Leader A1 Fleet Monitoring System.</p>
                </div>
            `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] ✅ ${days}-day reminder sent to ${to} (ID: ${info.messageId})`);
        return true;
    } catch (e) {
        console.error(`[EMAIL] ❌ Failed to send to ${to}:`, e);
        return false;
    }
};

export const sendDisconnectionEmail = async (to: string, driverName: string): Promise<boolean> => {
    try {
        const mailOptions = {
            from: FROM,
            to,
            subject: `🔴 ELD Disconnection Alert: ${driverName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #dc2626;">ELD Device Disconnected</h2>
                    <p>Hi <strong>${driverName}</strong>,</p>
                    <p>Your ELD device has been detected as <strong>DISCONNECTED</strong> from the Leader ELD network.</p>
                    <p>Please ensure your device is properly connected to avoid compliance issues.</p>
                    <br/>
                    <p style="color: #64748b; font-size: 0.875rem;">This is an automated alert from the Leader A1 Fleet Monitoring System.</p>
                </div>
            `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] ✅ Disconnection alert sent to ${to} (ID: ${info.messageId})`);
        return true;
    } catch (e) {
        console.error(`[EMAIL] ❌ Failed to send disconnection alert to ${to}:`, e);
        return false;
    }
};
