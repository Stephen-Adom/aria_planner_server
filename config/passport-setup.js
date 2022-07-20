const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20");
const User = require("../models/user.model");

passport.serializeUser(async (user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);

  if (user) done(null, user);
});

// use Google Strategy
passport.use(
  new GoogleStrategy(
    {
      // options for passport google strategy
      callbackURL: "http://127.0.0.1:3000/auth/google/callback",
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      const googleInfo = profile._json;

      const currentUser = await User.findOne({ email: googleInfo.email });

      if (!currentUser) {
        const uuid = await createUuid();

        const user = new User({
          uuid: uuid,
          userType: "USER",
          firstname: googleInfo.given_name,
          lastname: googleInfo.family_name,
          email: googleInfo.email,
          phonenumber: null,
          password: null,
          active: true,
          lastLoginAt: new Date().toString(),
          image: googleInfo.picture,
        });

        console.log(user);

        const newUser = await user.save();

        done(null, newUser);
      } else {
        done(null, currentUser);
      }
    }
  )
);
