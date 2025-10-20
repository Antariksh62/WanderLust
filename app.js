/*
TO IMPLEMENT:
0. ALIGN THE TOTAL AFTER TAXES TOGGLES PROPERLY VERTICALLY
   CHANGE ITS BORDER COLOR TO THE ONE THAT MATCHES THE SEARCH BOX BORDER COLOR

0. BUILD SEARCH FEATURE INCLUDING BACKEND
1. DARK MODE
2. A CLASSIFICATION FOR ADDING LISTING VIA ENUM IN DB
3. ADD DIFF CURRENCIES FOR PRICES
*/


if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

console.log("In app.js, after dotenv:", process.env.CLOUD_API_SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 8080;
const path = require("path");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


app.use(flash());

const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const review = require("./models/review.js");


// const MONGO_URL = "mongodb://127.0.0.1:27017/WanderLust";
const dbUrl = process.env.ATLASDB_URL;

main()
.then(() => {
    console.log()
})
.catch(err => console.log(err));
async function main() {
  await mongoose.connect(dbUrl);
}

app.use(express.urlencoded({extended : true}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// app.use(express.static(path.join(__dirname, "/public")));

app.use(express.static("public"));


app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

const store = MongoStore.create({
    mongoUrl : dbUrl,
    crypto : {
        secret : process.env.SECRET,
    },
    touchAfter : 24 * 3600,
})

const sessionOptions = {
    store : store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expire : Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge : 1000 * 60 * 60 * 24 * 7,
        httpOnly : true, //cookie is not accessable via JS browser
        // secure : true //send cookie only via https
    },
}


store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE");
});

app.use(session(sessionOptions));


/*Passport realted */
app.use(passport.initialize());
app.use(passport.session());
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.mapToken = process.env.MAP_TOKEN;
    next();
})

app.get("/demouser", async (req, res) => {
    let fakeUser = new User({
        email : "fakeUser@gamil.com",
        name : "stark",
        username : "BadSatrk",
    });

    let registeredUser =  await User.register(fakeUser, "helloworld");
    res.send(registeredUser);
})

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

app.get("/", (req, res) => {
    console.log("Proof that Tony stark has a heart");
    res.send("Proof that Tony stark has a heart");
});


/*
app.get("/testListing", async (req, res) => {
    
    let sampleListing  = new Listing({
        title : "My new villa",
        description : "Life by the beach",
        price : 12000,
        location : "pittsburgh",
        country : "USA",
    });

    await sampleListing.save()
    .then(res => {
        console.log(res);
    })
    .catch(err => {
        console.log(err);
    })
    
    console.log("sample saved");
    res.send("successful testing");
    
});
*/



// //THIS IS NOT WOKRING BECAUSE "*" IS SUPPROTED IN EXPRESS 4 BUT NOT IN EXPRESS 5
// //AND I AM USING EXPRESS 5 WHICH USES THIS /.*/
// //to handle : when you enter a route that does not exist
// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "Page not found"));
// });


//to handle : when you enter a route that does not exist
app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});


//middleware for custom ExpressError that is there is utils folder
app.use((err, req, res, next) => {
    let {statusCode = 500, message = "Something went wrong"} = err;
    res.status(statusCode).render("./listings/error.ejs", {err});
    // res.status(statusCode).send(message);
});

// In app.js, at the bottom
app.use((err, req, res, next) => {
    // ADD THESE LOGS
    console.log("--- FINAL ERROR HANDLER TRIGGERED ---");
    console.error(err); // Log the full error object
    console.log("------------------------------------");
    
    let { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("./listings/error.ejs", { err });
});


app.listen(port, () => {
    console.log(`server is listening to port ${port}`);
});