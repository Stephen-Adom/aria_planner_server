const Joi = require("joi");

const RegisterSchema = Joi.object({
  firstname: Joi.string().required().trim(),
  lastname: Joi.string().trim().required(),
  email: Joi.string().lowercase().email().trim().required(),
  phonenumber: Joi.string().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "password does not match" }),
});

module.exports = RegisterSchema;
