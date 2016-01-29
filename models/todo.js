// Sequelize import format
module.exports = function (sequelize, DataTypes) {
    // Return new model
    return sequelize.define('todo', {
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 250] // only allow strings with more than 1 and less than 250 characters
            }
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
    });
};