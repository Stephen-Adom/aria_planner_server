const express = require("express");
const GroupTaskSchema = require("../validations/group-task.validation");
const PersonalTaskSchema = require("../validations/persona_task.validation");
const createError = require("http-errors");
const GroupTask = require("../models/task.model");
const PersonalTask = require("../models/personal-task.model");
const User = require("../models/user.model");
const moment = require("moment");
const NewProjectAlert = require("../emails/project-alert-emails/new-project-email-alert");
const router = express.Router();

/** GROUP TASKS ROUTES */
router.post("/group_task/save", async (req, res, next) => {
  try {
    let auth_id = req.payload.aud;
    // const authUser = await User.findById(auth_id);
    let projectStatus = "Pending";
    const {
      title,
      description,
      startDate,
      endDate,
      members,
      attachments,
      leader,
    } = req.body;
    const result = await GroupTaskSchema.validateAsync({
      title,
      description,
      startDate,
      endDate,
      members,
      attachments,
      leader,
    });
    const currentDate = new Date();
    const projectDate = new Date(result.startDate);
    if (projectDate < currentDate)
      throw createError.BadRequest("Project Start Date is past due");
    if (projectDate == currentDate) this.projectStatus = "In_progress";
    if (result.members.length > 5)
      throw createError.Conflict(
        "Maximum Participant for Project has exceeded 5"
      );
    const task = new GroupTask({
      title: result.title,
      description: result.description,
      startDate: result.startDate,
      endDate: result.endDate,
      members: result.members,
      attachments: result.attachments,
      completedDate: "",
      createdBy: auth_id,
      leader: leader,
      status: projectStatus,
    });
    const newTask = await task.save();
    res.send({
      status: 200,
      message: "New Task Created",
      data: newTask,
    });

    NewProjectAlert(newTask, auth_id).then(
      (response) => {
        console.log(response);
      },
      (error) => {
        console.log(error);
      }
    );
  } catch (error) {
    next(error);
  }
});

router.patch("/group_task/assign/:id", async (req, res, next) => {
  try {
    const projectid = req.params.id;

    const { leader } = req.body;

    const groupTask = await GroupTask.findByIdAndUpdate(
      projectid,
      { leader },
      { new: true }
    );

    res.send({
      status: 200,
      data: groupTask,
      message: "New Leader Assigned",
    });
  } catch (error) {
    next(error);
  }
});

router.put("/group_task/start/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    const existingProject = await GroupTask.findById(id);

    if (!existingProject) throw createError.NotFound("Project Not Found");

    const project = await GroupTask.findByIdAndUpdate(id, {
      status: "In_progress",
      startDate: new Date().toString(),
    });

    res.send({
      status: 200,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/group_task/cancel/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    const task = await GroupTask.findByIdAndUpdate(id, { status: "Cancelled" });

    res.send({
      status: 200,
      message: "The Current Project has been Cancelled",
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/group_task/complete/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const task = await GroupTask.findByIdAndUpdate(id, {
      completedDate: new Date().toString(),
      status: "Completed",
    });

    res.send({
      status: 200,
      message: "The Current Project has been Completed",
      data: task,
    });

    res.send;
  } catch (error) {
    next(error);
  }
});

router.get("/group_task/all", async (req, res, next) => {
  try {
    const id = req.payload.aud;
    const user = await User.findById(id);
    const tasks = await GroupTask.find({
      "members.member_uuid": user.uuid,
    }).sort({
      createdAt: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/group_task/user/completed", async (req, res, next) => {
  try {
    const id = req.payload.aud;
    const user = await User.findById(id);
    const tasks = await GroupTask.find({
      $and: [
        {
          "members.member_uuid": user.uuid,
        },
        { status: "Completed" },
      ],
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/group_task/pending", async (req, res, next) => {
  try {
    const tasks = await GroupTask.find({ status: "Pending" }).sort({
      startDate: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/group_task/in_progress", async (req, res, next) => {
  try {
    const tasks = await GroupTask.find({ status: "In_progress" }).sort({
      startDate: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/group_task/cancelled", async (req, res, next) => {
  try {
    const tasks = await GroupTask.find({ status: "Cancelled" }).sort({
      updatedAt: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/group_task/completed", async (req, res, next) => {
  try {
    const tasks = await GroupTask.find({ status: "Completed" }).sort({
      completedDate: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/group_task/assign/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const { member } = req.body;
    const user = await User.findById(member._id);

    if (user.active == false)
      throw createError.Conflict("User Account is not Active");

    const project = await GroupTask.findById(id);

    if (!project) throw createError.NotFound("Project Not Found");

    if (project.members.length === 5)
      throw createError.Conflict(
        "Current Project has reached its Maximum Members"
      );

    const existingMember = project.members.find(
      (item) => item.member_uuid === user.uuid
    );

    if (existingMember) throw createError.Conflict("User is Already A Member");

    project.members.push({
      firstname: user.firstname,
      image: user.image,
      lastname: user.lastname,
      userType: user.userType,
      member_email: user.email,
      member_uuid: user.uuid,
    });

    await project.save();

    res.send({
      status: 200,
      message: "New Member Added",
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/group_task/assign/members/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const { members } = req.body;

    const project = await GroupTask.findById(id);

    if (!project) throw createError.NotFound("Project Not Found");

    if (project.members.length === 5)
      throw createError.Conflict(
        "Current Project has reached its Maximum Members"
      );

    members.forEach((member) => {
      const memberExist = project.members.find(
        (item) => item.member_uuid === member.uuid
      );
      if (memberExist)
        throw createError.Conflict(
          `${memberExist.firstname} ${memberExist.lastname} already exist`
        );
      project.members.push(member);
    });
    const updatedProject = await project.save({ new: true });

    res.send({
      status: 200,
      data: updatedProject,
      message: "New Member Added",
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/group_task/remove/member/:id", async (req, res, next) => {
  try {
    const projectid = req.params.id;
    const { member } = req.body;

    const project = await GroupTask.findByIdAndUpdate(
      projectid,
      {
        $pull: { members: { member_uuid: member.member_uuid } },
      },
      { new: true }
    );

    if (!project) throw createError.NotFound("Project Not Found");

    res.send({
      status: 200,
      data: project,
      message: "MEMBER REMOVED",
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/group_task/attachment/update/:id", async (req, res, next) => {
  try {
    const projectid = req.params.id;
    const { attachments } = req.body;

    if (!attachments.length)
      throw createError.Conflict("NO ATTACHMENT(S) AVAILABLE");

    await Promise.all(
      attachments.map(async (attachment) => {
        const attachmentObj = {
          name: attachment.name,
          file: attachment.file,
          filetype: attachment.filetype,
          filesize: attachment.filesize,
          createdAt: moment().format(),
          updatedAt: moment().format(),
        };

        await GroupTask.findByIdAndUpdate(projectid, {
          $push: {
            attachments: attachmentObj,
          },
        });
      })
    );

    const updatedproject = await GroupTask.findById(projectid);

    res.send({
      status: 200,
      data: updatedproject,
      message: "New Attachment(s) Added",
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/group_task/attachment/remove/:id", async (req, res, next) => {
  try {
    const projectid = req.params.id;
    const { attachment } = req.body;

    const project = await GroupTask.findByIdAndUpdate(
      projectid,
      {
        $pull: {
          attachments: { _id: attachment._id },
        },
      },
      { new: true }
    );

    res.send({
      status: 200,
      data: project,
      message: "Attachment(s) Removed",
    });
  } catch (error) {
    next(error);
  }
});
/** GROUP TASKS ROUTES */

/** PERSONAL TASKS ROUTES */
router.post("/personal_task/save", async (req, res, next) => {
  try {
    let auth_id = req.payload.aud;
    let projectStatus = "Pending";

    const { title, description, startDate, endDate, attachments } = req.body;

    const result = await PersonalTaskSchema.validateAsync({
      title,
      description,
      startDate,
      endDate,
      attachments,
    });

    const currentDate = new Date();
    const projectDate = new Date(result.startDate);

    if (projectDate < currentDate)
      throw createError.BadRequest("Project Start Date is past due");

    if (projectDate == currentDate) this.projectStatus = "In_progress";

    const task = new PersonalTask({
      user_id: auth_id,
      title: result.title,
      description: result.description,
      startDate: result.startDate,
      endDate: result.endDate,
      attachments: result.attachments,
      completedDate: "",
      status: projectStatus,
    });

    const newTask = await task.save();

    res.send({
      status: 200,
      message: "New Task Created",
      data: newTask,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/personal_task/start/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    const existingProject = await PersonalTask.findById(id);

    if (!existingProject) throw createError.NotFound("Project Not Found");

    const project = await PersonalTask.findByIdAndUpdate(id, {
      status: "In_progress",
      startDate: new Date().toString(),
    });

    res.send({
      status: 200,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/personal_task/cancel/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    const task = await PersonalTask.findByIdAndUpdate(id, {
      status: "Cancelled",
    });

    res.send({
      status: 200,
      message: "The Current Project has been Cancelled",
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/personal_task/complete/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const task = await PersonalTask.findByIdAndUpdate(id, {
      completedDate: new Date().toString(),
      status: "Completed",
    });

    res.send({
      status: 200,
      message: "The Current Project has been Completed",
      data: task,
    });

    res.send;
  } catch (error) {
    next(error);
  }
});

router.get("/personal_task/all", async (req, res, next) => {
  try {
    const id = req.payload.aud;
    console.log(id);
    const tasks = await PersonalTask.find({ user_id: id }).sort({
      createdAt: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/personal_task/pending", async (req, res, next) => {
  try {
    const id = req.payload.aud;
    const tasks = await PersonalTask.find({
      $and: [{ user_id: id }, { status: "Pending" }],
    }).sort({
      startDate: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/personal_task/in_progress", async (req, res, next) => {
  try {
    const id = req.payload.aud;
    const tasks = await PersonalTask.find({
      $and: [{ user_id: id }, { status: "In_progress" }],
    }).sort({
      startDate: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/personal_task/cancelled", async (req, res, next) => {
  try {
    const id = req.payload.aud;
    const tasks = await PersonalTask.find({
      $and: [{ user_id: id }, { status: "Cancelled" }],
    }).sort({
      updatedAt: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/personal_task/completed", async (req, res, next) => {
  try {
    const id = req.payload.aud;
    const tasks = await PersonalTask.find({
      $and: [{ user_id: id }, { status: "Completed" }],
    }).sort({
      completedDate: 1,
    });

    res.send({
      status: 200,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});
/** PERSONAL TASKS ROUTES */

/** ATTACHMENT ROUTERS */
router.get("/attachment/group", async (req, res, next) => {
  try {
    const authid = req.payload.aud;
    // const AuthUser = await User.findById(authid);
    const attachments = await GroupTask.find(
      {},
      {
        _id: 1,
        attachments: 1,
        createdAt: 1,
        title: 1,
        createdBy: 1,
      }
    );

    console.log(attachments);

    res.send({
      status: 200,
      data: attachments,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/attachment/personal", async (req, res, next) => {
  try {
    const authid = req.payload.aud;
    const attachments = await PersonalTask.find(
      { user_id: authid },
      { _id: 1, attachments: 1, createdAt: 1, title: 1 }
    );

    res.send({
      status: 200,
      data: attachments,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/attachment/update/:id", async (req, res, next) => {
  try {
    const projectid = req.params.id;
    const { attachments } = req.body;

    if (!attachments.length)
      throw createError.Conflict("NO ATTACHMENT(S) AVAILABLE");

    await Promise.all(
      attachments.map(async (attachment) => {
        const attachmentObj = {
          name: attachment.name,
          file: attachment.file,
          filetype: attachment.filetype,
          filesize: attachment.filesize,
          createdAt: moment().format(),
          updatedAt: moment().format(),
        };

        await GroupTask.findByIdAndUpdate(projectid, {
          $push: {
            attachments: attachmentObj,
          },
        });
      })
    );

    const newattachments = await GroupTask.findOne(
      { _id: projectid },
      {
        _id: 1,
        attachments: 1,
        createdAt: 1,
        title: 1,
        createdBy: 1,
      }
    );

    res.send({
      status: 200,
      data: newattachments,
      message: "New Attachment(s) Added",
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/attachment/personal/update/:id", async (req, res, next) => {
  try {
    const projectid = req.params.id;
    const { attachments } = req.body;

    if (!attachments.length)
      throw createError.Conflict("NO ATTACHMENT(S) AVAILABLE");

    const project = await PersonalTask.findByIdAndUpdate(
      projectid,
      {
        $push: {
          attachments: attachments,
        },
      },
      { new: true }
    );

    const newattachments = await PersonalTask.findOne(
      { _id: projectid },
      {
        _id: 1,
        attachments: 1,
        createdAt: 1,
        title: 1,
        createdBy: 1,
      }
    );

    console.log(newattachments);

    res.send({
      status: 200,
      data: newattachments,
      message: "New Attachment(s) Added",
    });
  } catch (error) {
    next(error);
  }
});
/** ATTACHMENT ROUTERS */
module.exports = router;
