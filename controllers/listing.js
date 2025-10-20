const Listing = require("../models/listing");

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geoCodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs", { allListings });
    } catch (err) {
        console.log(err);
    }
}

module.exports.renderNewForm = (req, res) => {
    console.log(req.user);
    //middleware.js 
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path : "reviews",
            populate : {
                path : "author",
            },
        })
        .populate("owner");
    if(!listing){
        req.flash("error", "The Listing does exist");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
}



// controllers/listing.js
//OLD STUFF WHICH WAS GIVING ISSUES
// module.exports.createListing = async (req, res, next) => {

//     /* This one line sends the req.file object directly to the browser */
//     // res.send(req.file);

//     let response = await geoCodingClient
//         .forwardGeocode({
//             query: 'Pune, Maharashtra',
//             limit: 1,
//         })
//         .send();

//     console.log(response.body.features[0].geometry);
//     res.send("done !");

//     let url = req.file.path;
//     let filename = req.file.filename;
//     console.log(`url : ${url}\nfilename : ${filename}`);

//     const newListing = new Listing(req.body.listing);
//     newListing.owner = req.user.id;
//     newListing.image = {url, filename};
//     await newListing.save();

//     req.flash("Success", "new Listing was Created");
//     res.redirect("/listings");
// };

//NEW CODE, WOKRKS GOOD, FOR NOW
module.exports.createListing = async (req, res, next) => {

    let response = await geoCodingClient
        .forwardGeocode({
            query: req.body.listing.location, 
            limit: 1,
        })
        .send();
    
    console.log(response.body.features[0].geometry);

    let url = req.file.path;
    let filename = req.file.filename;

    // FIX: Ensure you are using lowercase 'listing' here
    const newListing = new Listing(req.body.listing);
    
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry;

    let savedListing = await newListing.save();
    console.log(savedListing);

    req.flash("Success", "New listing was created!");
    res.redirect("/listings");
};




  module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "The Listing does exist");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
}


module.exports.updateListing = async (req, res) => {

    let { id } = req.params;
    let listingData = req.body.listing;
    let listing  = await Listing.findByIdAndUpdate(id, {...req.body.listing});

    if (listingData.image && listingData.image.url) {
        let imageUrl = listingData.image.url;

        if (imageUrl.includes("drive.google.com/file/d/")) {
            const match = imageUrl.match(/\/file\/d\/([^/]+)/);


            if (match && match[1]) {
                const fileId = match[1];
                const newUrl = `https://lh3.googleusercontent.com/d/FILE_ID`;
                listingData.image.url = newUrl; // Update the URL
                console.log("Generated Image URL on update:", newUrl);
            }
        }
    }

    // if(typeof req.file !== "undefined"){
    //         let listing  = await Listing.findByIdAndUpdate(id, {...req.body.listing});

    //     let url = req.file.path;
    //     let filename = req.file.filename;
    //     listing.image = { url, filename };
    //     await listing.save();
    // }

    if (typeof req.file !== "undefined") {
        // If yes, get the new URL and filename from Cloudinary
        let url = req.file.path;
        let filename = req.file.filename;
        // Update the listing's image property
        listing.image = { url, filename };
        // Save the changes to the image
        await listing.save();
    }

    req.flash("success", "Listing Updated Successfully");
    res.redirect(`/listings/${id}`);
}


module.exports.destroyListing = async (req, res) => {
        
    console.log(`[DELETE /listings/:id] Route handler started.`);
    let { id } = req.params;
    
    // This logic might need to be adjusted based on your post-delete middleware removal
    await Listing.findByIdAndDelete(id);
    
    req.flash("success", "Listing Deleted Successfully");
    console.log(`[DELETE /listings/:id] Logic complete. Redirecting now.`);
    res.redirect("/listings");
}