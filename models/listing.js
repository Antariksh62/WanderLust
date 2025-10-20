const mongoose = require("mongoose");
const Review = require("./review");
const Schema = mongoose.Schema;

const listingSchema = new Schema({

    title: { type: String, required: true },

    description: String,

    image: {
        url: String,
        filename: String,
    },

    price: Number,

    location: String,

    country: String,

    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],

    owner : {
        type : Schema.Types.ObjectId,
        ref : "User",
    },
    
    geometry : {
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point'
          required: true
        },
        coordinates: {
          type: [Number],
          required: true
        }
      }
});

/*
Now the reason why this is commented is coz 
we dont want to put a middleware inside a model,
we can put a middleware only if one side needs it but we dont coz it gets harder to debug,
if both sides need to reference each other (circular dependency) then we dont put it at all
*/
// listingSchema.post("findOneAndDelete", async (listing) => {
//     await Review.deleteMany({_id : {$in : listing.reviews}});
// })

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;





// const mongoose = require('mongoose');
// const Review = require('./review');
// const { types, ref } = require('joi');
// const Schema = mongoose.Schema;

// // main().catch(err => console.log(err));
// // async function main() {
// //   await mongoose.connect('mongodb://127.0.0.1:27017/test');
// //   // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
// // }

// const listingSchema = new Schema({
//     title : {
//         type : String,
//         required : true,
//     },
//     description : String,
//     image : {
//         url: String,
//         filename: String,
//     },
//     price : Number,
//     location : String,
//     country : String,
//     reviews : [
//         {
//             type : Schema.Types.ObjectId,
//             ref : "Review",
//         },
//     ]
// })

// // Middleware: after a listing is deleted, remove all its reviews
// listingSchema.post("findOneAndDelete", async function (doc) {
//     if (doc) {
//         await Review.deleteMany({ _id: { $in: doc.reviews } });
//     }
// });

// const Listing = mongoose.model("Listing", listingSchema);
// module.exports = Listing;