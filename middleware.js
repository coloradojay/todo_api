var cryptojs = require('crypto-js');

module.exports = function(db) {

    return {
        requireAuthentication: function(req, res, next){
            // grab the Auth token from the header, if doesnt exist, set to empty string
            var token = req.get('Auth') || '';

            db.token.findOne({
                where: {
                    // Find the token hash and set it equal to the MD5 hashed version of the token in the db as a string
                    tokenHash: cryptojs.MD5(token).toString()
                }
            }).then(function(tokenInstance) {
                if(!tokenInstance){
                    throw new Error();
                }

                req.token = tokenInstance;
                return db.user.findByToken(token);
            }).then(function(user){
                req.user = user;
                next();
            }).catch(function(){
                res.status(401).send();
            });

        }

    };


};