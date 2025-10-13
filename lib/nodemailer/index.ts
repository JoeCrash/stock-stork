import nodemailer from 'nodemailer';
import {NEWS_SUMMARY_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE} from "@/lib/nodemailer/templates";

if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD) {
    throw new Error(
        'Missing required email configuration: NODEMAILER_EMAIL and NODEMAILER_PASSWORD must be set'
    );
}

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD!,
    },
});

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"TickerPilot" <hello@tickerpilot.com>`,
        to: email,
        subject: 'Welcome to Tickerpilot - Your stock market toolkit is ready!',
        text: 'Thanks for joining tickerpilot.',
        html: htmlTemplate,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Welcome email sent:', { messageId: info.messageId, to: email });
        return info;
    } catch (error) {
        console.error('Failed to send welcome email:', { error, to: email });
        throw new Error(`Failed to send welcome email to ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }): Promise<void> => {

    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"TickerPilot" <hello@tickerpilot.com>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from TickerPilot`,
        html: htmlTemplate,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Summary email sent:', { messageId: info.messageId, to: email });
    } catch (error) {
        console.error('Failed to send summary email:', { error, to: email });
        throw new Error(`Failed to send summary email to ${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

