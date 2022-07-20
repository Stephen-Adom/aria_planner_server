const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const settingsSchema = new Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    receive_notification: {
      type: Boolean,
      required: true,
      default: true,
    },
    notification_type: {
      type: String,
      default: "email",
      required: true,
    },
    theme: {
      type: String,
      required: true,
      default: "light-theme",
    },
  },
  { timestamps: true }
);

const SettingsModel = mongoose.model("settings", settingsSchema);

module.exports = SettingsModel;
