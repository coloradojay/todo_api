var cryptojs = require('crypto-js');

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('token', {
        // 2 attributes (token, tokenHash)
        // do not allow null, length has to be greater than 1
        // convert token to MD5, set it to a string
        token: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [1]
            },
            set: function (value) {
                var hash = cryptojs.MD5(value).toString();

                this.setDataValue('token', value);
                this.setDataValue('tokenHash', hash);
            }
        },
        tokenHash: DataTypes.STRING
    });

};