const mongoose = require("mongoose");

mongoose.connect(process.env.DB_URI);

mongoose.connection
  .once("open", () => {
    console.log("Connection has been made to mongodb");
  })
  .on("error", (error) => {
    console.log("Connection Error " + error);
  });
