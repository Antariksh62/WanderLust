// In middleware.js
const Listing = require("./models/listing");
const Review = require("./models/review.js");
const User = require("./models/user.js");

const { listingSchema } = require("./schema.js");
const { reviewSchema } = require("./schema.js");
const { userSchema } = require("./schema.js");

const ExpressError = require("./utils/ExpressError.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        console.log(`[isLoggedIn] User NOT authenticated for ${req.originalUrl}. Redirecting...`);
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to do that!");
        return res.redirect("/login");
    }
    console.log(`[isLoggedIn] User is authenticated. Calling next().`);
    next();
};

module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, msg);
    } else {
        next();
    }
};


module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let {id} = req.params;
    let listing =  await Listing.findById(id);
    if(!listing.owner.equals(res.locals.currUser._id)){
        req.flash("Error", "You are not the owner of this listing!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    let {id, reviewId} = req.params;
    let review =  await Review.findById(reviewId);
    if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error", "You are not the author of this review, You can't delete it!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res , next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        req.flash("error", "You are not the author of this review, You can't delete it!");
        const msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, msg);
    } else {
        next();
    }
};
