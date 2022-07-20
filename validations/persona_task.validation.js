const Joi = require("joi");

const PersonalTaskSchema = Joi.object({
  title: Joi.string().required().trim(),
  description: Joi.string().required(),
  startDate: Joi.string().required(),
  endDate: Joi.string().required(),
  attachments: Joi.array().default([]),
});

module.exports = PersonalTaskSchema;
