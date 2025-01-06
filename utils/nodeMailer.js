const nodemailer = require('nodemailer')

async function mailSender  (email, title, body){
    try {
        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_SENDER,
                pass: process.env.APP_PASSWORD,
            },
        });

        let info = await transporter.sendMail({
            from: `CricGears <${process.env.EMAIL_SENDER}>`,
            to: email,
            subject: title || "OTP VERIFICATION FROM CricGears",
            html: body,
        });

        console.log("Email sent:", info);
        return info;
    } catch (err) {
        console.error("Error sending email:", err);
        throw err;  // Rethrow to allow caller to handle
    }
}

module.exports={ mailSender }