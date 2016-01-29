var Sequelize = require('sequelize');

var sequelize = new Sequelize('tododb', null, null, {
    dialect: 'postgres'
});

var db = {};

db.todo = sequelize.import(__dirname + '/models/todo.js');
db.user = sequelize.import(__dirname + '/models/user.js');
db.sequelize = sequelize; // sequelize instance
db.Sequelize = Sequelize; // sequelize library

db.todo.belongsTo(db.user);
db.user.hasMany(db.todo);

module.exports = db;