import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import expressListEndpoints from "express-list-endpoints";
import session from "express-session";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

dotenv.config(); // this code loads .env file on local & onRender's enviroment variables
const { Schema } = mongoose;
const mongoUrl = process.env.MONGO_URL; // load from .env or onrender's enviroment
mongoose.connect(mongoUrl);
mongoose.Promise = Promise;

const userSchema = new Schema({
  username: { type: String, unique: true, required: true, minLength: 4 },
  email: {
    type: String,
    unique: true,
    required: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  password: { type: String, required: true, minLength: 4 },
  accessToken: { type: String, default: () => bcrypt.genSaltSync() },
});

const User = mongoose.model("User", userSchema);

const port = process.env.PORT; // load from .env or onrender's enviroment
const app = express();

const authUser = async (username, password, done) => {
  try {
    const user = await User.findOne({ username });

    if (user && bcrypt.compareSync(password, user.password)) {
      return done(null, user);
    } else {
      return done("error comparing passwords", false);
    }
  } catch (error) {
    return done("error logging in", false);
  }
};

// Function for authenticate by session
const checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send();
};

// Function for authenticate by token
const authToken = async (req, res, next) => {
  const user = await User.findOne({ accessToken: req.header("Authorization") });
  if (user) {
    req.user = user;
    next();
  } else {
    res
      .status(401)
      .json({ message: "You are not allowed to see our top secret message!" });
  }
};

// Middleware for initializing session
app.use(
  session({
    secret: process.env.SECRET, // load from .env or onrender's enviroment
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.SECURE === "true",
      // domain: process.env.FRONTEND_DOMAIN,
      sameSite: process.env.SECURE === "true" ? "none" : "lax",
      httpOnly: true, // Make session cookie unavailable to read in frontend for security
    },
  })
);
// init passport on every route call
app.use(passport.initialize());
// allow passport to use "express-session"
app.use(passport.session());
// Add middlewares to enable cors and json body parsing
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN, // load from .env or onrender's enviroment
    credentials: true,
    methods: ["GET", "POST"],
  }) // Allow sending credentials from frontend to backend
);
app.use(express.json());

// Start defining your routes here
app.get("/", (req, res) => {
  const endpoints = expressListEndpoints(app);
  res.json(endpoints);
});

// Sign-up
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (username.length < 4) {
      return res
        .status(400)
        .json({ message: "Username must be at least 4 characters long." });
    }
    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    if (password.length < 4) {
      return res
        .status(400)
        .json({ message: "Password must be at least 4 characters long." });
    }

    const user = new User({
      username,
      email,
      password: bcrypt.hashSync(password, 10),
    });

    await user.save();
    res.status(201).json({ id: user._id, accessToken: user.accessToken });
  } catch (error) {
    console.log("Failed to sign up", error);
    res
      .status(400)
      .json({ message: "Could not sign up.", error: error.errors });
  }
});

// Log-in
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).end();

    req.logIn(user, (err) => {
      console.log("Error logging in: ", err);
      if (err) return next(err);
      console.log("User logged in: ", user);
      res.cookie("test", "value");
      return res.status(200).end();
    });
  })(req, res, next);
});

// Log-out
app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  });
});

// sessions - Authentication method 1 - by session
app.get("/sessions", checkAuthenticated, (req, res) => {
  res.json({
    ID: req.user._id,
    name: req.user.username,
    AccessToken: req.user.accessToken,
  });
});

// secrets - Authentication method 2 - by Token
app.get("/secrets", authToken);
app.get("/secrets", (req, res) => {
  res.json({ secret: "This is a super secret message" });
});

passport.use(new LocalStrategy(authUser));
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
