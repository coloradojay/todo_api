var express = require('express');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var _ = require('underscore');
var db = require('./db');
// Pass in the db object to the middleware function
var middleware = require('./middleware')(db);
var app = express();
var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Express Time Baby!');
});

// GET all toods
app.get('/todos', middleware.requireAuthentication, function (req, res) {
    /** CHALLENGE
     * Recreate using sequelize method's where & findAll */
    var query = req.query;
    var where = {};

    // If statement to check the completed property exists and if true, then where.completed = true, if false than false
    // Check if there is a query with length > 0
    // Add to the where object (I.e. description) as an object using wildcards to search by
    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        where.completed = true;
    }
    else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        where.completed = false;
    }

    if (query.hasOwnProperty('q') && query.q.length > 0) {
        where.description = {
            $like: '%' + query.q + '%'
        };
    }
    db.todo.findAll({where: where})
        .then(function (todos) {
            res.json(todos);
        }, function (error) {
            res.status(500).send(error);
        });
});

// GET specific todo
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    /** CHALLENGE
     * Use the sequelize findById to find a id from the params
     * If you find the todo, respond with the todo as JSON
     * If you do not find a todo, send a 404 response
     * If there's an error, send a 500 error */
    db.todo.findById(todoId)
        .then(function (todo) {
            if (todo) {
                res.json(todo.toJSON());
            }
            else {
                res.status(404).send();
            }
        }, function (error) {
            res.status(500).send(error);
        });
});

app.post('/todos/', middleware.requireAuthentication, function (req, res) {
    // Use underscore method _.pick to only use the whitelisted fields (description, completed)
    var body = _.pick(req.body, 'description', 'completed');

    /** CHALLENGE
     * Call db.todo.create function
     * Save todo in db
     * If successful, respond with todo in JSON format
     * If unsuccessful, respond with 400 and pass in error */
    db.todo.create(body)
        .then(function (todo) {
            // We have access to the user object via the requireAuthentication custom middleware
            // Call addTodo and pass in the todo
            req.user.addTodo(todo)
                .then(function(){
                    // Then we want to reload the db so that we get an updated info from the db
                    return todo.reload();
                }).then(function(todo){
                    // Then we want to respond with the todo in JSON for the user who the todo belongs to
                    res.json(todo.toJSON());
                });
        }, function (error) {
            res.status(400).json(error);
        });
});

app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    db.todo.destroy({
        where: {
            id: todoId
        }
    }).then(function (rowsDeleted) {
        if (rowsDeleted === 0) {
            res.status(404).json({
                error: 'No todo with id'
            });
        }
        else {
            // 204 went well and nothing to send back
            res.status(204).send();
        }
    }, function (error) {
        res.status(500).send(error);
    });

});

app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};

    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }

    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }

    db.todo.findById(todoId)
        .then(function (todo) {
            if (todo) {
                todo.update(attributes)
                    .then(function (todo) {
                        // success callback on todo with update attributes
                        res.json(todo.toJSON());
                    }, function (error) {
                        res.status(400).send(error);
                    });
            }
            else {
                res.status(404).send();
            }
        }, function () {
            res.status(500).send();
        });
});

app.post('/users/', function (req, res) {
    // Use underscore method _.pick to only use the whitelisted fields (email, password)
    var body = _.pick(req.body, 'email', 'password');

    /** CHALLENGE
     * Call db.todo.create function
     * Save todo in sqlite db
     * If successful, respond with todo in JSON format
     * If unsuccessful, respond with 400 and pass in error */
    db.user.create(body)
        .then(function (user) {
            res.json(user.toPublicJSON());
        }, function (error) {
            res.status(400).json(error);
        });

});

// POST /users/login
app.post('/users/login', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');

    // custom class method
    db.user.authenticate(body)
        .then(function(user){
            var token  = user.generateToken('authentication');
            if(token){
                // If there is a token, respond with the toPublicJSON instance method
                res.header('Auth', token).json(user.toPublicJSON());
            }
            else {
                // If the user credentials are incorrect, throw a 401 unauthorized code
                res.status(401).send();
            }
        }, function(e){
            // If there is an error, send 400 bad request
            res.status(400).send(e);
        });
});

db.sequelize.sync({force: true}).then(function () {
    // Start the server
    app.listen(PORT, function () {
        console.log('The party is happening at port', PORT);
    });
});