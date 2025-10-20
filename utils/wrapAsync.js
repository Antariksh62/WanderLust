module.exports = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    }
}


/*
The above code is a shorter version of 
writing the below code

function wrapAsync(fn){
    return function(req, res, next){
        fn(req, res, next).catch(next);
    }
}
module.exports = wrapAsync;
*/
