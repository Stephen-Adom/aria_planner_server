const express = require("express");
const router = express.Router();
const {
  GroupChatModel,
  GroupParticipantModel,
  GroupMessageModel,
} = require("../models/group-chat.model");

const { ChatModel, MessagesModel } = require("../models/personal-chat");
const User = require("../models/user.model");

const createError = require("http-errors");

router.post("/group/create", async (req, res, next) => {
  try {
    const authid = req.payload.aud;

    const authUser = await User.findById(authid);

    const { name, project, image } = req.body;

    const existingChat = await GroupChatModel.findOne({ project: project._id });

    if (existingChat) throw createError.Conflict("Chat Session Already Exist");

    const group = new GroupChatModel({
      name: name,
      image: image,
      project: project._id,
      created_By: authUser.uuid,
      last_message: {
        message: "",
        date: "",
      },
    });

    const newGroup = await group.save();

    project.members.forEach((member) => {
      const membermodel = new GroupParticipantModel({
        group_id: newGroup._id.toString(),
        user: {
          user_id: member.member_uuid,
          firstname: member.firstname,
          lastname: member.lastname,
          image: member.image,
        },
      });

      membermodel.save();
    });

    res.send({
      status: 200,
      message: "New Group Chat Created",
      data: newGroup,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/group/verify/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    const chatExist = await GroupChatModel.findOne({ project: id });

    if (chatExist) {
      res.send({
        status: 200,
        data: chatExist,
      });
    } else {
      res.send({
        status: 200,
        data: null,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/group/participants/:id", async (req, res, next) => {
  try {
    const groupid = req.params.id;

    const participants = await GroupParticipantModel.find({
      group_id: groupid,
    });

    res.send({
      status: 200,
      data: participants,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/group/session/:id", async (req, res, next) => {
  try {
    const project = req.params.id;

    const group = await GroupChatModel.findOne({ project });

    if (group) {
      res.send({
        status: 200,
        data: group,
      });
    } else {
      res.send({
        status: 200,
        data: null,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/group/messages/:id", async (req, res, next) => {
  try {
    const projectid = req.params.id;

    const messages = await GroupMessageModel.find({ group_id: projectid });

    res.send({
      status: 200,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/group/edit/:id", async (req, res, next) => {
  try {
    const chatid = req.params.id;

    const { name, image } = req.body;

    const chat = await GroupChatModel.findByIdAndUpdate(
      chatid,
      { name: name, image: image },
      { new: true }
    );

    res.send({
      status: 200,
      data: chat,
      message: "Chat Updated",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/save", async (req, res, next) => {
  try {
    const { receiver, sender } = req.body;

    const chatObj = new ChatModel({
      receiver: receiver,
      sender: sender,
      last_message: {
        message: null,
        date: null,
      },
      last_seen: null,
    });

    const newChat = await chatObj.save();

    res.send({
      status: 200,
      data: newChat,
      message: "New Chat Created",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/unread", async (req, res, next) => {
  try {
    const chatObj = await MessagesModel.aggregate([
      {
        $match: {
          $and: [
            { status: "sent" },
            // { chat_id: "61858f9df5021db388d0c8ff" },
            // { sender: "USR-HRJIPZE" },
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

    res.send({
      status: 200,
      data: chatObj,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
