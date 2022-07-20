const nodemailer = require("nodemailer");
const createError = require("http-errors");
const mg = require("nodemailer-mailgun-transport");
const handlebars = require("handlebars");
const User = require("../../models/user.model");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

const NewProjectAlert = async (project, auth_id) => {
  return new Promise((resolve, reject) => {
    User.findById(auth_id).then((authUser) => {
      const authFullName = authUser.firstname + " " + authUser.lastname;
      const Members = project.members;

      const emailTemplateSource = fs.readFileSync(
        path.join(__dirname, "/new-project-email-alert.hbs"),
        "utf8"
      );

      const mailgunAuth = {
        auth: {
          api_key: process.env.MAILGUN_API,
          domain: process.env.MAILGUN_DOMAIN,
        },
      };

      const smtpTransport = nodemailer.createTransport(mg(mailgunAuth));
      const htmltemplate = handlebars.compile(emailTemplateSource);

      const htmlToSend = htmltemplate({
        project: project.title,
        startdate: moment(new Date(project.startDate)).format("lll"),
        author: authFullName,
      });

      Members.forEach((member) => {
        const mailOptions = {
          from: "saaddae003@st.ug.edu.gh",
          to: member.member_email,
          subject: "NEW PROJECT ALERT",
          html: htmlToSend,
        };

        smtpTransport.sendMail(mailOptions, (error, response) => {
          if (error) {
            console.log(error);
            return reject(createError.InternalServerError());
          } else {
            return resolve(response);
          }
        });
      });
    });
  });
};

module.exports = NewProjectAlert;
