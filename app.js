//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const  FacebookStrategy = require("passport-facebook");


const app = express();

app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs');

app.use(session({
  secret:"this is our test",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v2/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));




mongoose.connect("mongodb://localhost:27017/userDB");
mongoose.set('strictQuery', false);

const userSchema = new mongoose.Schema ({
  email:String,
  password:String,
  googleId:String,
  facebookId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id);
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});


app.get("/",function(req,res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  app.get("/auth/facebook",
  passport.authenticate('facebook'));

  app.get("/auth/facebook/secrets",
  passport.authenticate('facebook', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  User.find({"secret": {$ne: null}}, function(err,foundusers){
    if (err) {
      console.log(err);
    } else {
      if (foundusers) {
        res.render("secrets", {userswithsecrets: foundusers })
      }
    }
  });
});

app.get("/submit",function(req,res){
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req,res){
  req.logout(function(err){
    if (!err) {
      res.redirect("/");
    }
  });
});

app.post("/submit",function(req,res){
  const secretsrecordeed = req.body.secret;

User.findById(req.user.id, function(err, founduser){
  if (err) {
    console.log(err);
  } else {
    if (founduser) {
      founduser.secret = secretsrecordeed
     founduser.save(function(){
       res.redirect("/secrets");
     });
    }
  }
});


})



app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });


  });



app.post("/login",function(req,res){

  const user = new User ({
    username:req.body.username,
    password:req.body.password
  })

    req.login(user,function(err){
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        });
      }
    });


});












app.listen(3000,function(){
  console.log("server started on port 3000");
});
