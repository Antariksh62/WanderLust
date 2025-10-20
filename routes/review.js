const express = require("express");

// //this router does not inherit params from the parent route.
// const router = express.Router();

//child router inherits parameters from the parent route.
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const { isLoggedIn, isReviewAuthor, validateReview } = require("../middleware.js");
const reviewController = require("../controllers/review.js");


//delete review route
router.delete(
    "/:reviewId", 
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.destroyReview)
);


//reviews
//post route
//we are establishing one to n relationship, check db
router.post(
    "/", 
    isLoggedIn,
    validateReview, 
    wrapAsync(reviewController.createReview)
);


module.exports = router;