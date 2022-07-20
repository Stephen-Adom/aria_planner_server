const express = require("express");
const createError = require("http-errors");
const Activity = require("../models/activity-log.model");
const moment = require("moment");

const router = express.Router();

router.get("/all", async (req, res, next) => {
  try {
    const activities = await Activity.find({}).sort({ createdAt: -1 });

    res.send({
      status: 200,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/update/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const activity = await Activity.findByIdAndUpdate(
      id,
      { read: true, read_at: moment().format() },
      { new: true }
    );

    res.send({
      status: 200,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
