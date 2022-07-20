const User = require("../../models/user.model");
const Activity = require("../../models/activity-log.model");
const socket = require("../../socket.connections/socket.server");

const NewGroupProjectLog = async (req, res, next) => {
  try {
    const authid = req.payload.aud;
    const authUser = await User.findById(authid);

    const activityObj = new Activity({
      user: {
        id: authUser.uuid,
        image: authUser.image,
        firstname: authUser.firstname,
        lastname: authUser.lastname,
      },
      activity: "New Group Project Was Created",
    });

    const newActivity = await activityObj.save();

    console.log(newActivity, socket.id);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  NewGroupProjectLog,
};
