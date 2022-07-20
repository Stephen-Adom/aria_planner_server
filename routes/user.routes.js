const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const User = require("../models/user.model");
const SettingsModel = require("../models/settings.model");
const {
  verifyCurrentPassword,
  hashPassword,
} = require("../custom-functions/comparePassword");

router.post("/profile/update", async (req, res, next) => {
  try {
    const id = req.payload.aud;
    const user = await User.findById(id);

    if (!user) throw createError.NotFound("USER NOT FOUND");

    const imageString = req.body.image;

    const updatedUser = await User.findByIdAndUpdate(id, {
      image: imageString,
    });

    res.send({
      status: 200,
      data: updatedUser,
      message: "Profile Updated",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/all", async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: 1 });

    res.send({
      status: 200,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    const user = await User.findOne({ uuid: id });

    res.send({
      status: 200,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/info/update", async (req, res, next) => {
  try {
    const authid = req.payload.aud;
    const { firstname, lastname, email, phonenumber } = req.body;

    const exituser = await User.findById({ $ne: authid }).where({
      $or: [{ email: email }, { phonenumber: phonenumber }],
    });

    if (exituser)
      throw createError.Conflict(
        "Email or Phonenumber Entered is Already in Use"
      );

    const authUser = await User.findByIdAndUpdate(authid, {
      firstname: firstname,
      lastname: lastname,
      email: email,
      phonenumber: phonenumber,
    });

    if (!authUser) throw createError.NotFound("User Not Found");

    res.send({
      status: 200,
      data: authUser,
      message: "User Info Updated",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/notification/receive_alert", async (req, res, next) => {
  try {
    const authId = req.payload.aud;

    const { receive_notification } = req.body;

    const updatedsettings = await SettingsModel.findOneAndUpdate(
      { user_id: authId },
      { receive_notification },
      { new: true }
    );

    res.send({
      status: 200,
      data: updatedsettings,
      message: "Settings Updated",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/notification/type", async (req, res, next) => {
  try {
    const authId = req.payload.aud;

    const { notification_type } = req.body;

    const updatedsettings = await SettingsModel.findOneAndUpdate(
      { user_id: authId },
      { notification_type },
      { new: true }
    );

    res.send({
      status: 200,
      data: updatedsettings,
      message: "Settings Updated",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/notification/theme", async (req, res, next) => {
  try {
    const authId = req.payload.aud;

    const { theme } = req.body;

    const updatedsettings = await SettingsModel.findOneAndUpdate(
      { user_id: authId },
      { theme },
      { new: true }
    );

    res.send({
      status: 200,
      data: updatedsettings,
      message: "Settings Updated",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/password/change", async (req, res, next) => {
  try {
    const authid = req.payload.aud;

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(authid);

    if (!user) throw createError.NotFound("User Not Found");

    const passwordVerified = await verifyCurrentPassword(
      currentPassword,
      user.password
    );

    if (!passwordVerified)
      throw createError.Conflict("Current Password Entered is Incorrect");

    const newPasswordHashed = await hashPassword(newPassword);

    const newUser = await User.findByIdAndUpdate(
      authid,
      { password: newPasswordHashed },
      { new: true }
    );

    res.send({
      status: 200,
      message: "Password Updated",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/settings/:id", async (req, res, next) => {
  try {
    const userid = req.params.id;

    const settings = await SettingsModel.findOne({ user_id: userid });

    res.send({
      status: 200,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
