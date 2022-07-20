const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const createrror = require("http-errors");
require("dotenv").config();
require("./connection/db-connection");
const helmet = require("helmet");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const TaskRoutes = require("./routes/task.routes");
const ChatRoutes = require("./routes/chat-routes");
const ActivityRoutes = require("./routes/activities.routes");
const passport = require("passport");
const passportSetup = require("./config/passport-setup");
const { verifyAccessToken } = require("./key_gen/token_gen");
const http = require("http");

const app = express();
// CREATE SERVER
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }, { limit: "50mb" }));
app.use(passport.initialize());
app.use(helmet.contentSecurityPolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());
app.disable("x-powered-by");

/** APP ROUTES */

app.use("/auth", authRoutes);
app.use("/user", verifyAccessToken, userRoutes);
app.use("/task", verifyAccessToken, TaskRoutes);
app.use("/chat", verifyAccessToken, ChatRoutes);
app.use("/activity", verifyAccessToken, ActivityRoutes);

/** APP ROUTES */

/** ERROR HANDLER ROUTES */

app.use(async (req, res, next) => {
  // const error = createrror.NotFound();
  next();
});

app.use(async (err, req, res, next) => {
  console.log(err);
  res.status(err.status || 404);
  res.send({
    status: err.status,
    message: err.message,
  });
});

/** ERROR HANDLER ROUTES */

// INITIALISE SOCKET IO
const io = socket(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
  },
});

server.listen(process.env.PORT, () => {
  console.log(`Server is currently running on port ${process.env.PORT}`);
});

require("./socket.connections/socket.server")(io);
