const createError = require("http-errors");
const bcrypt = require("bcrypt");

const verifyCurrentPassword = async (
  currentPasswordText,
  currentPasswordHash
) => {
  try {
    return await bcrypt.compare(currentPasswordText, currentPasswordHash);
  } catch (error) {
    console.log(error);
    throw createError.InternalServerError();
  }
};

const hashPassword = async (newpassword) => {
  try {
    const saltRounds = await bcrypt.genSalt(10);
    return await bcrypt.hash(newpassword, saltRounds);
  } catch (error) {
    console.log(error);
    throw createError.InternalServerError();
  }
};

module.exports = {
  verifyCurrentPassword,
  hashPassword,
};
