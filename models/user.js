var bcrypt = require('bcrypt'),
    _ = require('underscore'),
    jwt = require('jsonwebtoken'),
    cryptjs = require('crypto-js');

// Sequelize import function
module.exports = function (sequelize, DataTypes) {
// User model
    var user = sequelize.define('user', {
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true
                }
            },
            salt: {
                type: DataTypes.STRING
            },
            password_hash: {
                type: DataTypes.STRING
            },
            password: {
                type: DataTypes.VIRTUAL,
                allowNull: false,
                validate: {
                    len: [7, 100] // length has to be between 7 and 100 characters
                },
                set: function (value) {
                    // Generate salt
                    var salt = bcrypt.genSaltSync(10);
                    var hashedPassword = bcrypt.hashSync(value, salt);
                    // Set the password as the value passed in as a virtual data type
                    this.setDataValue('password', value);
                    // Set the salt value in the db
                    this.setDataValue('salt', salt);
                    // Set the password hashed field in the db
                    this.setDataValue('password_hash', hashedPassword);
                }
            }
        },
        {
            hooks: {
                beforeValidate: function (user, options) {
                    if (typeof user.email === 'string') {
                        user.email = user.email.toLowerCase();
                    }
                }
            },
            classMethods: {
                authenticate: function (body) {
                    return new Promise(function (resolve, reject) {
                        // validate the required fields passed are indeed strings
                        if (typeof body.email !== 'string' || typeof body.password !== 'string') {
                            return reject();
                        }

                        // Use the sequelize findOne method to locate a user based on email
                        // Then if there is a user and the password is the same as the hashed password
                        // Return the user with the publicJSON instance method we created to only show specific data
                        // If there's an error reject the promise
                        user.findOne({
                            where: {
                                email: body.email
                            }
                        }).then(function (user) {
                            if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
                                return reject();
                            }
                            resolve(user);
                        }, function () {
                            reject();
                        });
                    });
                },
                findByToken: function (token) {
                    return new Promise(function(resolve, reject){
                        try {
                            // Use jwt.verify to decode the token with the secret we used to encode the token
                            var decodedJWT = jwt.verify(token, 'qwerty098');
                            // Use cryptojs decrypt on the decodedtoken with token and use the secret key from below
                            var bytes = cryptjs.AES.decrypt(decodedJWT.token, 'abc123@#$');
                            // Parse the bytes variable, format to a string and encode using UTF8
                            var tokenData = JSON.parse(bytes.toString(cryptjs.enc.Utf8));
                            // id and type are returned, use them to find the user by ID
                            user.findById(tokenData.id)
                                .then(function(user){
                                    if(user){
                                       resolve(user);
                                    }
                                    else {
                                        reject();
                                    }
                                }, function(e){
                                   reject();
                                });
                        }
                        catch (e) {
                            reject();
                        }
                    });
                }
            },
            instanceMethods: {
                toPublicJSON: function () {
                    var json = this.toJSON();
                    return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
                },
                generateToken: function (type) {
                    if (!_.isString(type)) {
                        return undefined;
                    }

                    try {
                        // pass in user data and secret
                        var stringData = JSON.stringify({
                            id: this.get('id'),
                            type: type
                        });
                        // encrypted secret abc123@#$
                        var encryptedData = cryptjs.AES.encrypt(stringData, 'abc123@#$').toString();
                        var token = jwt.sign({
                            token: encryptedData
                        }, 'qwerty098');
                        return token;
                    }
                    catch (e) {
                        return undefined;
                    }
                }
            }
        });
    return user;
};