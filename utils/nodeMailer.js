const nodemailer = require("nodemailer");
const { EMAIL_VERIFY,reset_password } = require("./emailTemplate");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL ,
    pass: process.env.SMTP_PASSWORD ,
  },
});

const sendMail = async (email, subject, html) => {
  console.log("email is here");
  
console.log(email);

  const mailOptions = {
    from: "abc@gmail.com",
    to:email,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);
    return { success: true, info };
  } catch (error) {
    console.error(" Error sending email:", error);
    return { success: false, error };
  }
};

const verifyEmail = async (email, name, otp) => {
  console.log(" Attempting to send email to:", email); // Add this line
  const subject = "OTP Verification";
  const html = await EMAIL_VERIFY(name, otp);
  return await sendMail(email, subject, html);
};

const forgotpassword = async (email, name, otp) => {
  const subject = "OTP Verification";
  const html = await reset_password(name, otp);
  return await sendMail(email, subject, html);
};


module.exports = {
  sendMail,
  verifyEmail,
  forgotpassword
};
