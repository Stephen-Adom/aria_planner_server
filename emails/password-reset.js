const nodemailer = require("nodemailer");
const createError = require("http-errors");
const mg = require("nodemailer-mailgun-transport");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const passwordResetMail = async function (token, User) {
  return new Promise((resolve, reject) => {
    const emailTemplateSource = fs.readFileSync(
      path.join(__dirname, "/password-reset-template.hbs"),
      "utf8"
    );

    const mailgunAuth = {
      auth: {
        api_key: process.env.MAILGUN_API,
        domain: process.env.MAILGUN_DOMAIN,
      },
    };

    const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));

    const template = handlebars.compile(emailTemplateSource);

    link = "http://localhost:4200/auth/password-reset/verify?t=" + token;

    const htmlToSend = template({ link: link, name: User.firstname });

    const mailOptions = {
      from: "saaddae003@st.ug.edu.gh",
      to: User.email,
      subject: "RESET PASSWORD",
      html: htmlToSend,
    };

    smtpTransport.sendMail(mailOptions, function (error, response) {
      if (error) {
        return reject(createError.InternalServerError());
      } else {
        return resolve(response);
      }
    });
  });
};

module.exports = { passwordResetMail };
