const createError = require("http-errors");

createUuid = async function () {
  try {
    return new Promise((resolve, reject) => {
      var result = "";
      var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < 7; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }

      if (!result) {
        return reject(createError.InternalServerError());
      }

      return resolve("USR-" + result);
    });
  } catch (error) {
    throw createError.InternalServerError();
  }
};

module.exports = { createUuid };
