const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
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
    receiver: {
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
    last_message: {
      message: {
        type: String,
      },
      date: {
        type: Date,
      },
    },
    last_seen: {
      type: String,
    },
  },
  { timestamps: true }
);

const FileSchema = new Schema(
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

const MessageSchema = new Schema(
  {
    chat_id: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
    receiver: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    attachments: [FileSchema],
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

const ChatModel = mongoose.model("chats", ChatSchema);
const MessagesModel = mongoose.model("chat-messages", MessageSchema);

module.exports = {
  ChatModel,
  MessagesModel,
};
