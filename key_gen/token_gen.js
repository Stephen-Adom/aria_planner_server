const JWT = require("jsonwebtoken");
const createError = require("http-errors");

const createAccessToken = async (user) => {
  return new Promise((resolve, reject) => {
    const payload = {};

    const secret = process.env.ACCESS_TOKEN_SECRET;

    const options = {
      expiresIn: "1h",
      audience: user.id,
      issuer: "aria_planner",
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        return reject(createError.InternalServerError());
      }

      if (token) {
        return resolve(token);
      }
    });
  });
};

const verifyAccessToken = async (req, res, next) => {
  try {
    if (!req.headers["authorization"]) throw createError.Unauthorized();

    const authHeader = req.headers["authorization"];
    const headerArray = authHeader.split(" ");
    const token = headerArray[1];

    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          throw createError.Unauthorized("Unauthorized Access. Token Expired");
        } else {
          throw createError.Unauthorized();
        }
      }

      req.payload = payload;
      next();
    });
  } catch (error) {
    next(error);
  }
};

const createRefreshToken = async (user) => {
  return new Promise((resolve, reject) => {
    const payload = {};

    const secret = process.env.REFRESH_TOKEN_SECRET;

    const options = {
      expiresIn: "1y",
      audience: user.id,
      issuer: "aria_planner",
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        return reject(createError.InternalServerError());
      }

      if (token) {
        return resolve(token);
      }
    });
  });
};

const verifyRefreshToken = async (token) => {
  return new Promise((resolve, reject) => {
    JWT.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return reject(createError.Unauthorized("Token Has Expired"));
        } else {
          return reject(createError.Unauthorized());
        }
      }

      console.log(payload);
      return resolve(payload);
    });
  });
};

const createEmailVerifyToken = async (userid) => {
  return new Promise((resolve, reject) => {
    const payload = {};

    const secret = process.env.EMAIL_VERIFY_SECRET;

    const options = {
      expiresIn: "3h",
      audience: userid,
      issuer: "aria_planner",
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        return reject(createError.InternalServerError());
      }

      if (token) {
        return resolve(token);
      }
    });
  });
};

const verifyEmailToken = async (token) => {
  return new Promise((resolve, reject) => {
    JWT.verify(token, process.env.EMAIL_VERIFY_SECRET, (err, payload) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return reject(
            createError.Unauthorized("Email Verification Token Has Expired")
          );
        } else {
          return reject(createError.Unauthorized());
        }
      }

      return resolve(payload);
    });
  });
};

const createResetPasswordToken = async (user) => {
  return new Promise((resolve, reject) => {
    const payload = {};

    const secret = process.env.PASSWORD_RESET_SECRET;

    const options = {
      expiresIn: "10m",
      audience: user.id.toString(),
      issuer: "aria_planner",
    };

    JWT.sign(payload, secret, options, (err, token) => {
      if (err) {
        return reject(createError.InternalServerError());
      }

      if (token) {
        return resolve(token);
      }
    });
  });
};

const verifyResetPasswordToken = async (token) => {
  return new Promise((resolve, reject) => {
    JWT.verify(token, process.env.PASSWORD_RESET_SECRET, (err, payload) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return reject(
            createError.Unauthorized("Activation Link Has Expired")
          );
        } else {
          return reject(createError.Unauthorized());
        }
      }

      return resolve(payload);
    });
  });
};

module.exports = {
  createAccessToken,
  verifyAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  createEmailVerifyToken,
  verifyEmailToken,
  createResetPasswordToken,
  verifyResetPasswordToken,
};
