module.exports = function(db) {

    return {
        requireAuthentication: function(req, res, next){
            // grab the Auth token from the header
            var token = req.get('Auth');
            // find the user by the token value
            // custom method findByToken
            db.user.findByToken(token)
                .then(function(user){
                    // If we find the user, attach the user to the user object
                    req.user = user;
                    next();
                }, function(){
                    // Something went wrong
                    res.status(401).send();
                });
        }

    };


};