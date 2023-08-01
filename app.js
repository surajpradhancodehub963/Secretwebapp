const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const methodOverride = require("method-override");
const { connectDB, User } = require("./config/mongoose.js");
const { v4: uuidv4 } = require("uuid");
require('dotenv').config();

const app = express();

let fullName="";

/** ------------- Global Middleware -------------- */
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

/** ------------- Session setup in DB -------------- */
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, //1Day for expire the session in millisecond format
    },
  })
);

/** ------------- Passport Intialize -------------- */
app.use(passport.initialize());
app.use(passport.session());

/** ------------- Connecting to DB -------------- */
connectDB();

/** ----------creating statergy ---------- */
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/** ------------- ROUTES -------------- */
//home Route
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    let user = req.user;
    let secrets = user.secrets;
    fullName=req.user.fullname;
    res.render("index", { data: secrets,name:fullName });
  } else {
    res.redirect("/login");
  }
});
//addsecrets Route
app.post("/addsecret", async (req, res) => {

  let user = req.user;
  let userId = user._id.toString();

  let newSecret = {
    secret_id: uuidv4(),
    secret: req.body.secret,
  };

  let doc = await User.findById(userId).exec();

  doc.secrets.push(newSecret);

  await doc.save();

  res.redirect("/");
});
//delete secrets
app.delete("/delete", async (req,res)=>{

  let deleteId=req.body.secret_id;

  let userId = req.user._id.toString();

  let doc= await User.findById(userId).exec();

  const delete_index = doc.secrets.findIndex((a) => {
    return a.secret_id == deleteId;
  });

  doc.secrets.splice(delete_index, 1);

  await doc.save();

  res.redirect("/");
});
//Login Route
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.logIn(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});

//Signup Route
app.get("/signup", (req, res) => {
  res.render("signup");
});
app.post("/signup", (req, res) => {
  if (req.body.password === req.body.Confirm_password) {
    User.register(
      { username: req.body.username , fullname:req.body.fullName },
      req.body.password,
      function (err, user) {
        if (err) {
          console.log(err);
          res.redirect("/error");
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/");
          });
        }
      }
    );
  } else {
    console.log("passwords are not matching");
  }
});

//logout route
app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    fullName="";
    res.redirect("/login");
  });
});
//Just a error handling page
app.get("/error", (req, res) => {
  res.send("<h1>signup error</h1>");
});

/** ------------- Server Port Listenting -------------- */
const port=process.env.PORT || 3000
app.listen(port);
