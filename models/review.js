const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
    author : { 
        type : Schema.Types.ObjectId, 
        ref : "User",
    }
});

module.exports = mongoose.model("Review", reviewSchema);




// const { required } = require("joi");
// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;
// const Listing = require("./listing");

// const reviewSchema = new Schema({
//     comment : {
//         type : String,
//         required : true
//     },
//     rating : {
//         type : Number,
//         min : 1,
//         max : 5,
//     },
//     createdAt : {
//         type : Date,
//         default : Date.now(),
//     }
// });

// //Mongoose middleware: after a review is deleted, remove it from listings
// reviewSchema.post("findOneAndDelete", async function (doc) {
//     if (doc) {
//         await Listing.findOneAndUpdate(
//             { reviews: doc._id },
//             { $pull: { reviews: doc._id } }
//         );
//     }
// });



// module.exports = mongoose.model("Review", reviewSchema);