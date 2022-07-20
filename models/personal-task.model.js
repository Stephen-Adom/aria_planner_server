const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const attachmentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    file: {
      required: true,
      type: String,
    },
    filetype: {
      required: true,
      type: String,
    },
    filesize: {
      required: true,
      type: String,
    },
  },
  { timestamps: true }
);

const PersonalTaskSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    title: {
      required: true,
      type: String,
      trim: true,
      index: true,
    },
    description: {
      required: true,
      type: String,
      index: true,
    },
    startDate: {
      required: true,
      type: Date,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    completedDate: {
      type: Date,
      index: true,
    },
    attachments: [attachmentSchema],
    status: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

PersonalTaskSchema.index({ title: "text", description: "text" });

const PersonTaskModel = mongoose.model("personal_task", PersonalTaskSchema);

module.exports = PersonTaskModel;
