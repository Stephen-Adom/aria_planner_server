const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MemberSchema = new Schema({
  member_uuid: {
    type: String,
    index: true,
  },
  member_email: {
    type: String,
    index: true,
  },
  userType: {
    type: String,
    required: true,
  },
  firstname: {
    required: true,
    trim: true,
    type: String,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
  },
});

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

const GroupTaskSchema = new Schema(
  {
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
    createdBy: {
      type: String,
      required: true,
    },
    leader: {
      type: String,
      required: true,
    },
    members: [MemberSchema],
    attachments: [attachmentSchema],
    status: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

GroupTaskSchema.index({ title: "text", description: "text" });

const GroupTaskModel = mongoose.model("grouptask", GroupTaskSchema);

module.exports = GroupTaskModel;
