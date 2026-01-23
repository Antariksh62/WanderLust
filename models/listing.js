const mongoose = require("mongoose");
const Review = require("./review");
const { required, string } = require("joi");
const Schema = mongoose.Schema;

const listingSchema = new Schema({

    title: { 
        type: String, 
        required: true,
    },

    description: String,

    image: {
        url: String,
        filename: String,
    },

    price: {
        type : Number,
        required : true,
    },

    location: {
        type : String,
        required : true,
    },

    country: {
        type : String,
        required : true,
    },

    category: {
        type: String,
        enum: ["Trending", "Rooms", "Iconic", "Mountains", "Castles", "Amazing Pools", "Camping", "Farms", "Arctic", "Boats"],
        required: false,
    },

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
          type: String, //Don't do `{ location: { type: String } }`
          enum: ['Point'], //'location.type' must be 'Point'
          required: true,
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