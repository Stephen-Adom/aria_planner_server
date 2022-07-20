const express = require("express");
const createError = require("http-errors");
const RegisterSchema = require("../validations/register.validations");
const LoginSchema = require("../validations/login.validations");
const ResetSchema = require("../validations/reset-password.validation");
const User = require("../models/user.model");
const { createUuid } = require("../custom-functions/user-uuid-gen");
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  createEmailVerifyToken,
  verifyEmailToken,
  createResetPasswordToken,
  verifyResetPasswordToken,
} = require("../key_gen/token_gen");

const { emailVerificationMail } = require("../emails/email-verification");
const SettingsModel = require("../models/settings.model");

const passport = require("passport");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    // validate request body
    const result = await LoginSchema.validateAsync({
      email: req.body.email,
      password: req.body.password,
    });

    const user = await User.findOne({ email: result.email });

    if (!user) throw createError.NotFound("User not Found");

    if (user.active === false)
      throw createError(404, "User Account in Not Active!");

    const isValid = await user.isValidPassword(result.password);

    if (!isValid)
      throw createError.Unauthorized("Email / Password does not match");

    // UPDATE USER LOGIN TIME
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { lastLoginAt: new Date().toString() }
    );

    // FETCH USER SETTINGS

    const settings = await SettingsModel.findOne({
      user_id: updatedUser._id.toString(),
    });

    const accessToken = await createAccessToken(updatedUser); // create new access token;
    const refreshToken = await createRefreshToken(updatedUser); //create new refresh token;

    // create new user instance without password to be sent to client
    const newUserObj = {
      _id: updatedUser._id.toString(),
      userType: updatedUser.userType,
      uuid: updatedUser.uuid,
      firstname: updatedUser.firstname,
      lastname: updatedUser.lastname,
      email: updatedUser.email,
      phonenumber: updatedUser.phonenumber,
      active: updatedUser.active,
      lastLoginAt: updatedUser.lastLoginAt,
      image: updatedUser.image,
      createdAt: updatedUser.createdAt,
    };

    res.send({
      status: 200,
      message: "User Logged In Successfully",
      data: newUserObj,
      settings: settings,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    if (error.isJoi === true)
      return createError.BadRequest("Username / Password is not valid");
    next(error);
  }
});

// REGISTER NEW USER ROUTE
router.post("/register", async (req, res, next) => {
  try {
    // validate request body
    const result = await RegisterSchema.validateAsync({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phonenumber: req.body.phonenumber,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
    });

    const userExist = await User.findOne({
      $or: [{ email: result.email, phonenumber: result.phonenumber }],
    });

    if (userExist)
      throw createError.Conflict("Email / Phonenumber entered already exist");

    const uuid = await createUuid();

    const userObj = new User({
      uuid: uuid,
      userType: "USER",
      firstname: result.firstname,
      lastname: result.lastname,
      email: result.email,
      phonenumber: result.phonenumber,
      password: result.password,
      active: false,
      lastLoginAt: "",
      image: "",
    });

    const newUser = await userObj.save();

    const settingsObj = new SettingsModel({
      user_id: newUser._id.toString(),
      receive_notification: true,
      notification_type: "email",
      theme: "light-theme",
    });

    const newSettings = await settingsObj.save();

    const accessToken = await createAccessToken(newUser); // create access token;
    const refreshToken = await createRefreshToken(newUser); // create refresh token;

    const newUserObj = {
      _id: newUser._id.toString(),
      userType: newUser.userType,
      uuid: newUser.uuid,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      phonenumber: newUser.phonenumber,
      active: newUser.active,
      lastLoginAt: "",
      image: newUser.image,
    };

    res.send({
      status: 200,
      message: "New Member Registered Successfully",
      data: newUserObj,
      settings: newSettings,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

    // const emailToken = await createEmailVerifyToken(newUser._id.toString());

    // emailVerificationMail(emailToken, newUser)
    //   .then((response) => {
    //     if (response) {
    //       // create new user instance without password to be sent to client
    //       const newUserObj = {
    //         _id: newUser._id.toString(),
    //         userType: newUser.userType,
    //         uuid: newUser.uuid,
    //         firstname: newUser.firstname,
    //         lastname: newUser.lastname,
    //         email: newUser.email,
    //         phonenumber: newUser.phonenumber,
    //         active: newUser.active,
    //         lastLoginAt: "",
    //         image: newUser.image,
    //       };

    //       res.send({
    //         status: 200,
    //         message: "New Member Registered Successfully",
    //       });
    //     }
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     // throw createError.InternalServerError(err.message);
    //   });
  } catch (error) {
    if (error.isJoi === true) error.status = 422;
    console.log(error);
    next(error);
  }
});

router.post("/refresh-token", async (req, res, next) => {
  try {
    const { token } = req.body;

    const payload = await verifyRefreshToken(token);

    console.log(payload);

    if (!payload) {
      res.send({
        status: 401,
        message: "Refresh Token Expired",
      });
    }
    const userid = payload.aud;
    console.log(userid);
    const user = await User.findById(userid);
    const accessToken = await createAccessToken(user);
    const refreshToken = await createRefreshToken(user); // create refresh token;

    const newUserObj = {
      _id: user._id.toString(),
      userType: user.userType,
      uuid: user.uuid,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      phonenumber: user.phonenumber,
      active: user.active,
      lastLoginAt: user.lastLoginAt,
      image: user.image,
      createdAt: user.createdAt,
    };

    res.send({
      status: 200,
      message: "Token Refreshed",
      data: newUserObj,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = ResetSchema.validateAsync({ email });

    const user = await User.findOne({ email: result.email });

    if (!user) throw createError.NotFound("User Account Not Found");

    console.log(user);

    const token = await createResetPasswordToken(user);

    passwordResetMail(token, user)
      .then((response) => {
        if (response) {
          res.send({
            status: 200,
            message:
              "An Activation Link has been sent to your email account. Go to your email to follow instruction on how to reset your password",
          });
        }
      })
      .catch((error) => {
        throw createError.Conflict(
          "Email for Password Reset was not Successful"
        );
      });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password/update", async (res, req, next) => {
  try {
    const { token } = req.body;

    const payload = await verifyResetPasswordToken(token);
    const userid = payload.aud;

    const user = await User.findOneAndUpdate({ _id: userid }, { password: "" });

    res.send({
      status: 200,
      message: "User Account Has Been Reset",
    });
  } catch (error) {}
});

router.post("/email-token-verification", async (req, res, next) => {
  try {
    const { token } = req.body;

    const payload = await verifyEmailToken(token);
    const userid = payload.aud;

    const userExist = await User.findOne({ _id: userid });

    if (!userExist) throw createError.NotFound("User Account Not Found");

    if (userExist.active === true) {
      const accessToken = await createAccessToken(userExist); // create access token;
      const refreshToken = await createRefreshToken(userExist); // create refresh token;

      const newUserObj = {
        _id: userExist._id.toString(),
        userType: userExist.userType,
        uuid: userExist.uuid,
        firstname: userExist.firstname,
        lastname: userExist.lastname,
        email: userExist.email,
        phonenumber: userExist.phonenumber,
        active: userExist.active,
        lastLoginAt: userExist.lastLoginAt,
        image: userExist.image,
      };

      res.send({
        status: 200,
        message: "User Account Activated",
        data: newUserObj,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } else {
      const user = await User.findOneAndUpdate(
        { _id: userid },
        { $and: [{ active: true }, { lastLoginAt: new Date().toString() }] }
      );

      const newUserObj = {
        _id: user._id.toString(),
        userType: user.userType,
        uuid: user.uuid,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phonenumber: user.phonenumber,
        active: user.active,
        lastLoginAt: user.lastLoginAt,
        image: user.image,
      };

      res.send({
        status: 200,
        message: "User Account Activated",
        data: newUserObj,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google"),
  async (req, res, next) => {
    try {
      if (req.user) {
        const accessToken = await createAccessToken(req.user); // create access token;
        const refreshToken = await createRefreshToken(req.user); // create refresh token;
        var responseHTML =
          '<html><head><title>Main</title></head><body></body><script>res = %value%; window.opener.postMessage(res, "*");window.close();</script></html>';
        responseHTML = responseHTML.replace(
          "%value%",
          JSON.stringify({
            user: req.user,
            accessToken: accessToken,
            refreshToken: refreshToken,
          })
        );
        res.status(200).send(responseHTML);
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
