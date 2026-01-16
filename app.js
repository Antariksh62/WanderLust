/*
TO IMPLEMENT:


0. ALIGN THE TOTAL AFTER TAXES TOGGLES PROPERLY VERTICALLY
   CHANGE ITS BORDER COLOR TO THE ONE THAT MATCHES THE SEARCH BOX BORDER COLOR
   = DONE
1. DARK MODE = DONE
2. BUILD SEARCH FEATURE INCLUDING BACKEND = DONE
3. A CLASSIFICATION FOR ADDING LISTING VIA ENUM IN DB = DONE
4. ADD AI WRAPPER FOR DESCRIPTION = DONE
5. DEPLOY = DONE

6. MAKE A FEW FRONTEND CHANGES 

7. USE REDIS IN THIS PROJECT, NO CLUE HOW TO DO IT,BUT YEA WILL LEARN IT

*/

if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

console.log("In app.js, after dotenv:", process.env.GEMINI_API_KEY);

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
app.use(express.json()); // ✅ REQUIRED FOR AI ROUTE
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

// --- PASTE THIS IN APP.JS (Near the top, after your const requires) ---

const { GoogleGenerativeAI } = require("@google/generative-ai");

// 1. Setup the AI with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// 2. Create the Route
app.post("/listings/ai-generate", async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log("BODY:", req.body);


        if(!prompt){
            return res.status(400).json({ success:false, message:"Prompt missing" });
        }

        // Ask AI to write the description
        const input = `Write a short, catchy Airbnb listing description for a place with these features: ${prompt}. Keep it under 100 words.`;
        
        const result = await model.generateContent(input);
        const response = await result.response;
        const text = response.text();

        res.json({ success: true, description: text });
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ success: false, message: "AI Error" });
    }
});

app.use("/listings",listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

app.get("/", (req, res) => {
    console.log("Proof that Tony stark has a heart");
    res.redirect("/listings");
});

//to handle : when you enter a route that does not exist
app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

//middleware for custom ExpressError that is there is utils folder
app.use((err, req, res, next) => {
    console.error(err);
    let {statusCode = 500} = err;
    res.status(statusCode).render("./listings/error.ejs", {err});
});

app.listen(process.env.PORT || 8080, () => {
    console.log("Server is listening on port 8080");
});
