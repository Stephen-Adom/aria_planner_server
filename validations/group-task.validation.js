const Joi = require("joi");

const GroupTaskSchema = Joi.object({
  title: Joi.string().required().trim(),
  description: Joi.string().required(),
  startDate: Joi.string().required(),
  endDate: Joi.string().required(),
  members: Joi.array().required(),
  attachments: Joi.array().default([]),
  leader: Joi.string().required(),
});

module.exports = GroupTaskSchema;
