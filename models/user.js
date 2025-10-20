const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email : {
        type : String,
        required : true,
    },
    name : {
        type : String,
        required : true,
    },

});

//this will implement username, hashing and salting automatically
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);