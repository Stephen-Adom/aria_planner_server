const Joi = require("joi");

const ResetSchema = Joi.object({
  email: Joi.string().required().email(),
});

module.exports = ResetSchema;
