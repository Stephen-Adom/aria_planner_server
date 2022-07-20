const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ActivitySchema = new Schema(
  {
    user: {
      id: {
        type: String,
        required: true,
      },
      image: {
        type: String,
      },
      firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
    },
    activity: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      required: true,
      default: false,
    },
    read_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

const ActiivityModel = mongoose.model("activities", ActivitySchema);

module.exports = ActiivityModel;
