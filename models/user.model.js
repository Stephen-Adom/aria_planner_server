const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const createError = require("http-errors");

const userSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      unique: true,
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phonenumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    active: {
      required: true,
      type: Boolean,
    },
    image: {
      type: String,
    },
    lastLoginAt: {
      type: String,
    },
    password: {
      type: String,
      unique: true,
    },
    createdAt: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// userSchema.pre("save", async function (next) {
//   try {
//     this.firstname =
//       this.firstname.charAt(0).toUpperCase() +
//       this.firstname.substr(1).toLowerCase();
//     this.lastname =
//       this.lastname.charAt(0).toUpperCase() +
//       this.lastname.substr(1).toLowerCase();
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

userSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw createError.InternalServerError();
  }
};

const UserModel = mongoose.model("user", userSchema);

module.exports = UserModel;
