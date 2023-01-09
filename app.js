//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

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
// const secret = "thisistypeofatestsecret"
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

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

  const newuser = new User ({
    email:req.body.username,
    password:req.body.password
  });
  newuser.save(function(err){
    if (!err) {
      res.render("secrets");
    }
  });
});

app.post("/login",function(req,res){
  const userid = req.body.username
  const password = req.body.password

  User.findOne({email:userid},function(err,founduser){
    if (err) {
      console.log(error);
    } else {
      if (founduser) {
        if (founduser.password === password) {
        res.render("secrets")
        }
      }
    }
  });


});












app.listen(3000,function(){
  console.log("server started on port 3000");
});
