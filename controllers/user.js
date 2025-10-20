const User = require("../models/user");

module.exports.renderSignUpForm = (req, res) => {
    res.render("users/signup.ejs");
}

module.exports.signUp = async (req, res) => {
    try{
        let { name, username, email, password } = req.body;
        const newUser = new User({ name, username, email});
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if(err){
                return next(err);
            }
            let redirectUrl = res.locals.redirectUrl || "/listings";
            res.redirect(redirectUrl);
        });
    }
    catch(err){
        req.flash("error", err.message);
        res.redirect("/signup");
        console.log(err);
    }

}

module.exports.renderLogInForm = (req, res) => {
    res.render("users/login.ejs");
}

module.exports.logIn = async (req, res) => {
    req.flash("success", "Welcome back! You are now logged in.");

    // This ensures a single, correct redirect URL is used
    let redirectUrl = res.locals.redirectUrl || "/listings";

    if (redirectUrl.includes("/reviews")) {
        // This will take "/listings/123/reviews/456" and turn it into "/listings/123"
        redirectUrl = redirectUrl.split("/reviews")[0];
    }

    res.redirect(redirectUrl);
}

module.exports.logOut = (req, res) => {
    req.logout((err) => {
        if(err){
            next(err);
        }
        req.flash("success", "You are Logged Out Now, see you soon");
        return res.redirect("/listings");
    })
}