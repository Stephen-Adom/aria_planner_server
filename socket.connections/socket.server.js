const Activity = require("../models/activity-log.model");
const {
  GroupMessageModel,
  GroupChatModel,
} = require("../models/group-chat.model");
const moment = require("moment");
const User = require("../models/user.model");
const { ChatModel, MessagesModel } = require("../models/personal-chat");

module.exports = async (io) => {
  io.on("connection", (socket) => {
    console.log("Connection made on", socket.id);

    socket.on("joinChannel", async ({ authid }) => {
      socket.join(authid);

      const rooms = await getActiveRooms(io.sockets.adapter.rooms);
      console.log(rooms);

      io.emit("joinChannelSuccess", { rooms });
    });

    let AuthUser;

    socket.on("joinRoom", async ({ user, room }) => {
      //JOIN USER TO A ROOM
      socket.join(room);

      // FETCH CONNECTED USER DETAILS
      User.findOne({ uuid: user }).then((user) => {
        AuthUser = user;
        // NOTIFY OTHER USERS ABOUT JOINING THE CHAT
        socket.broadcast.emit("userOnline", `${user.firstname} is Online`);
      });
    });

    socket.on(
      "groupMessage",
      async ({ message, group, lastMessageid, attachments }) => {
        const newMessage = new GroupMessageModel({
          message: message,
          group_id: group,
          sender: {
            user_id: AuthUser.uuid,
            firstname: AuthUser.firstname,
            lastname: AuthUser.lastname,
            image: AuthUser.image,
          },
          attachments: attachments,
          thread: [],
          read_by: [],
        });

        const UpdatedMessage = await newMessage.save();
        const UpdatedSession = await GroupChatModel.findByIdAndUpdate(
          group,
          {
            "last_message.message": message
              ? message
              : `${attachments[attachments.length - 1].meta.name}`,
            "last_message.date": moment().format(),
          },
          { new: true }
        );
        io.in(group).emit("groupMessageSent", {
          message: UpdatedMessage,
          session: UpdatedSession,
        });
      }
    );

    socket.on("userTyping", ({ user }) => {
      socket.broadcast.emit("userTypingSent", user);
    });

    socket.on("stopTyping", () => {
      socket.broadcast.emit("stopTypingSent");
    });

    // PERSONAL CHAT EVENTS

    socket.on("fetchMyChats", async ({ uuid }) => {
      const AuthUser = await User.findOne({ uuid });

      if (AuthUser) {
        const myChats = await ChatModel.find({
          $or: [{ "sender.user_id": uuid }, { "receiver.user_id": uuid }],
        });

        socket.emit("fetchMyChatsSuccess", { chats: myChats });
      }
    });

    socket.on("fetchMyMessages", async ({ authid }) => {
      const messages = await MessagesModel.find({
        $or: [{ sender: authid }, { receiver: authid }],
      });

      socket.emit("fetchMyMessagesSuccess", { messages });
    });

    socket.on(
      "sendPersonalMessage",
      async ({ message, receiver, sender, attachments, chat }) => {
        console.log(receiver, sender);
        const messageObj = new MessagesModel({
          chat_id: chat,
          sender: sender,
          receiver: receiver,
          message: message,
          attachments: attachments,
          status: "sent",
        });

        const newMessage = await messageObj.save();

        const chatsession = await ChatModel.findByIdAndUpdate(
          chat,
          {
            "last_message.message": newMessage.message,
            "last_message.date": newMessage.createdAt,
          },
          { new: true }
        );

        io.to([receiver, sender]).emit("sendPersonalMessageSuccess", {
          message: newMessage,
          session: chatsession,
        });
      }
    );

    socket.on("messageIsRead", async ({ message }) => {
      const updatedMessage = await MessagesModel.findByIdAndUpdate(
        message._id,
        { status: "read" }
      );

      io.to([updatedMessage.receiver, updatedMessage.sender]).emit(
        "messageIsReadSuccess",
        {
          message: updatedMessage,
        }
      );
    });

    socket.on("fetchUnreadMessages", async ({ authid }) => {
      const unreadMessageCounts = await MessagesModel.aggregate([
        {
          $match: {
            $and: [{ status: "sent" }],
            $or: [
              {
                sender: authid,
              },
              {
                receiver: authid,
              },
            ],
          },
        },
        {
          $group: {
            _id: "$sender",
            chat_id: { $first: "$chat_id" },
            count: { $count: {} },
          },
        },
      ]);

      io.emit("fetchUnreadMessagesSuccess", { unreadMessageCounts });
    });

    socket.on("markAllUnreadMessages", async ({ sender, chatid }) => {
      const messages = await MessagesModel.updateMany(
        { $and: [{ sender: sender }, { chat_id: chatid }] },
        {
          status: "read",
        },
        { new: true }
      );

      const updatedMessages = await MessagesModel.find({ chat_id: chatid });

      io.emit("markAllUnreadMessagesSuccess", { updatedMessages });
    });

    // PERSONAL CHAT EVENTS

    socket.on("NewProjectCreated", async ({ author }) => {
      const activityObj = new Activity({
        user: {
          id: author.uuid,
          image: author.image,
          firstname: author.firstname,
          lastname: author.lastname,
        },
        activity: "New Group Project Was Created",
        read: false,
        read_at: null,
      });

      const newActivity = await activityObj.save();

      socket.emit("NewActivitySaved", { activity: newActivity });
    });

    socket.on(
      "NewMemberAssignedToProject",
      async ({ author, project, member }) => {
        const activityObj = new Activity({
          user: {
            id: author.uuid,
            image: author.image,
            firstname: author.firstname,
            lastname: author.lastname,
          },
          activity: `${member.firstname} ${member.lastname} has been assigned to project ${project.title}`,
          read: false,
          read_at: null,
        });

        const newActivity = await activityObj.save();

        socket.emit("NewMemberAssignedToProjectSuccess", {
          activity: newActivity,
        });
      }
    );

    socket.on("GroupProjectStarted", async ({ author, project }) => {
      const activityObj = new Activity({
        user: {
          id: author.uuid,
          image: author.image,
          firstname: author.firstname,
          lastname: author.lastname,
        },
        activity: `${project.title} Project has commenced`,
        read: false,
        read_at: null,
      });

      const newActivity = await activityObj.save();

      socket.emit("GroupProjectStartedSuccess", { activity: newActivity });
    });

    socket.on("GroupProjectCancelled", async ({ author, project }) => {
      const activityObj = new Activity({
        user: {
          id: author.uuid,
          image: author.image,
          firstname: author.firstname,
          lastname: author.lastname,
        },
        activity: `${project.title} Project has been canceled!`,
        read: false,
        read_at: null,
      });

      const newActivity = await activityObj.save();

      socket.emit("GroupProjectCancelledSuccess", { activity: newActivity });
    });

    socket.on("GroupProjectCompleted", async ({ author, project }) => {
      const activityObj = new Activity({
        user: {
          id: author.uuid,
          image: author.image,
          firstname: author.firstname,
          lastname: author.lastname,
        },
        activity: `${project.title} Project has been completed!`,
        read: false,
        read_at: null,
      });

      const newActivity = await activityObj.save();

      socket.emit("GroupProjectCompletedSuccess", { activity: newActivity });
    });

    socket.on("PersonalProjectStarted", async ({ author, project }) => {
      const activityObj = new Activity({
        user: {
          id: author.uuid,
          image: author.image,
          firstname: author.firstname,
          lastname: author.lastname,
        },
        activity: `${project.title} Project has been start!`,
        read: false,
        read_at: null,
      });

      const newActivity = await activityObj.save();

      socket.emit("PersonalProjectStartedSuccess", { activity: newActivity });
    });

    socket.on("PersonalProjectCancelled", async ({ author, project }) => {
      const activityObj = new Activity({
        user: {
          id: author.uuid,
          image: author.image,
          firstname: author.firstname,
          lastname: author.lastname,
        },
        activity: `${project.title} Project has been Canceled!`,
        read: false,
        read_at: null,
      });

      const newActivity = await activityObj.save();

      socket.emit("PersonalProjectCancelledSuccess", { activity: newActivity });
    });

    socket.on("PersonalProjectCompleted", async ({ author, project }) => {
      const activityObj = new Activity({
        user: {
          id: author.uuid,
          image: author.image,
          firstname: author.firstname,
          lastname: author.lastname,
        },
        activity: `${project.title} Project has been Completed!`,
        read: false,
        read_at: null,
      });

      const newActivity = await activityObj.save();

      socket.emit("PersonalProjectCompletedSuccess", { activity: newActivity });
    });

    socket.on("NewPersonalTaskCreated", async ({ author }) => {
      const activityObj = new Activity({
        user: {
          id: author.uuid,
          image: author.image,
          firstname: author.firstname,
          lastname: author.lastname,
        },
        activity: "New Personal Task Was Created",
        read: false,
        read_at: null,
      });

      const newActivity = await activityObj.save();

      socket.emit("NewPersonalTaskCreatedSuccess", { activity: newActivity });
    });

    socket.emit("connected", "You are connected");

    socket.on("leaveChannel", ({ authid }) => {
      socket.leave(authid);
      console.log("user disconnected");
      io.emit("leaveChannelSuccess", { authid });
    });
  });
};

function getActiveRooms(rooms) {
  // Convert map into 2D list:
  // ==> [['4ziBKG9XFS06NdtVAAAH', Set(1)], ['room1', Set(2)], ...]
  const arr = Array.from(rooms);
  // Filter rooms whose name exist in set:
  // ==> [['room1', Set(2)], ['room2', Set(2)]]
  const filtered = arr.filter((room) => !room[1].has(room[0]));
  // Return only the room name:
  // ==> ['room1', 'room2']
  const res = filtered.map((i) => i[0]);
  return res;
}
