const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: 'Sherif Ashraf <hello@sherif.io>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || '', 
    };

    await transport.sendMail(mailOptions);
  } catch (err) {
    console.error('Error sending email:', err);
    throw new Error('There was an error sending the email.');
  }
};

module.exports = sendEmail;
