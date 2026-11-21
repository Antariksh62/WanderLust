const Listing = require("../models/listing");
const Review = require("../models/review.js");

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geoCodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    const { search, category } = req.query; 
    let allListings;

    if (search) {
        // SEARCH LOGIC with regex special character escaping
        const cleanSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        allListings = await Listing.find({
            $or: [
                { title: { $regex: cleanSearch, $options: "i" } },
                { location: { $regex: cleanSearch, $options: "i" } },
                { country: { $regex: cleanSearch, $options: "i" } },
                { category: { $regex: cleanSearch, $options: "i" } } 
            ]
        });
    } else if (category) {
        allListings = await Listing.find({ category: category });
    } else {
        allListings = await Listing.find({});
    }

    res.render("listings/index.ejs", { allListings, search: search || "", category });
};


module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};


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
        req.flash("error", "The listing does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};


module.exports.createListing = async (req, res, next) => {
    let geometry = { type: "Point", coordinates: [77.2090, 28.6139] };
    try {
        let response = await geoCodingClient
            .forwardGeocode({
                query: req.body.listing.location, 
                limit: 1,
            })
            .send();
        if (response && response.body && response.body.features && response.body.features.length > 0) {
            geometry = response.body.features[0].geometry;
        }
    } catch (geoErr) {
        console.error("Geocoding failed, using fallback coordinates:", geoErr.message);
    }

    let url = (req.file && req.file.path) ? req.file.path : "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=60";
    let filename = (req.file && req.file.filename) ? req.file.filename : "listingimage";

    const newListing = new Listing(req.body.listing);
    
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = geometry;

    await newListing.save();

    req.flash("success", "New listing was created!");
    res.redirect("/listings");
};


module.exports.editListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "The listing does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
};


module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listingData = req.body.listing;

    if (listingData.image && listingData.image.url) {
        let imageUrl = listingData.image.url;

        if (imageUrl.includes("drive.google.com/file/d/")) {
            const match = imageUrl.match(/\/file\/d\/([^/]+)/);
            if (match && match[1]) {
                const fileId = match[1];
                const newUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
                listingData.image.url = newUrl;
            }
        }
    }

    let listing = await Listing.findByIdAndUpdate(id, { ...listingData }, { new: true });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated Successfully");
    res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (listing && listing.reviews && listing.reviews.length > 0) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
    await Listing.findByIdAndDelete(id);
    
    req.flash("success", "Listing Deleted Successfully");
    res.redirect("/listings");
};
