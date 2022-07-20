const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AttachmentSchema = new Schema(
  {
    file: {
      type: String,
    },
    meta: {
      name: {
        type: String,
      },
      type: {
        type: String,
      },
      size: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

const GroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    project: {
      type: String,
      required: true,
    },
    created_By: {
      type: String,
      required: true,
    },
    last_message: {
      message: {
        type: String,
      },
      date: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

const MessageSchema = new Schema(
  {
    message: {
      type: String,
    },
    group_id: {
      type: String,
      required: true,
    },
    sender: {
      user_id: {
        type: String,
        required: true,
      },
      firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
      image: {
        type: String,
      },
    },
    thread: [],
    attachments: [AttachmentSchema],
    read_by: [],
  },
  { timestamps: true }
);

const ParticipantSchema = new Schema(
  {
    group_id: {
      type: String,
    },
    user: {
      user_id: {
        type: String,
        required: true,
      },
      firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
      image: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

const GroupChatModel = mongoose.model("group_chats", GroupSchema);
const GroupMessageModel = mongoose.model("group_messages", MessageSchema);
const GroupParticipantModel = mongoose.model(
  "group_participant",
  ParticipantSchema
);

module.exports = {
  GroupChatModel,
  GroupMessageModel,
  GroupParticipantModel,
};
