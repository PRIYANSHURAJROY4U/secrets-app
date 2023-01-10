//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;


const app = express();

app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs');

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
  email:String,
  password:String
});
console.log(process.env.API_KEY);


const User = new mongoose.model("User",userSchema);

app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newuser = new User ({
      email:req.body.username,
      password: hash
    });
    newuser.save(function(err){
      if (!err) {
        res.render("secrets");
      }
    });
  });
  });



app.post("/login",function(req,res){
  const userid = req.body.username
  const password = req.body.password

  User.findOne({email:userid},function(err,founduser){
    if (err) {
      console.log(err);
    } else {
      if (founduser) {
        bcrypt.compare(password, founduser.password, function(err, result) {
          if (result === true) {
            res.render("secrets")
          }
      });
        }
      }
  });
});












app.listen(3000,function(){
  console.log("server started on port 3000");
});
