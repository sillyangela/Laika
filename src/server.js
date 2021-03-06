const express = require('express');
require('./db');
const path = require('path');
const expressSession = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const open = require('open');

const Client = mongoose.model('Client');
const Corp = mongoose.model('Corp');
const Transaction = mongoose.model('Transaction')
const passport = require('passport');
const flash = require('connect-flash')
const LocalStrategy = require('passport-local').Strategy;
const bCrypt = require('bcrypt-nodejs');

const app = express();

app.set('views', path.join(__dirname + '/views'));
app.set('view engine', 'hbs');

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '/../pets/src')));
app.use(express.static(path.join(__dirname, '/../build/contracts')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

const sessionOptions = {
    secret: 'secret for signing session id',
    saveUninitialized: false,
    resave: false
};
app.use(expressSession(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.serializeUser(function (user, done) {
    console.log('serializing user: ');
    console.log(user);
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        console.log('deserializing user:', user);
        done(err, user);
    });
});

login(passport);
signup(passport);

//rts
app.get('/', function (req, res) {
    res.render('index');
});
app.get('/home', function (req, res) {
    res.render('home');
});
app.get('/apply', function (req, res) {
    res.render('apply');
});
app.get('/charity', function (req, res) {
    res.render('charity');
});
app.get('/contactus', function (req, res) {
    res.render('contactus');
});
app.get('/donor', function (req, res) {
    res.render('donor');
});
app.get('/id', function (req, res) {
    res.render('id');
});
app.get('/market', function (req, res) {
    res.render('market');
});
app.get('/profile', function (req, res) {
    Client.findOne({
        id: "0x3e4Ed5623Ee2ceC10DDaFC67277dA0A94D08dc80"
    }, function (err, client) {
        res.render('profile', { client: client });
    })
});
app.get('/thankyou', function (req, res) {
    res.render('thankyou');
});
app.get('/tutorial', function (req, res) {
    res.render('tutorial');
});

app.get('/signout', function (req, res) {
    req.logout();
    res.redirect('/');
});

/* Handle Login POST */
app.post('/login', passport.authenticate('login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}));

/* Handle Registration POST */
app.post('/signup', passport.authenticate('signup', {
    successRedirect: '/profile',
    failureRedirect: '/donor',
    failureFlash: true
}));

/* Handle Logout */
app.get('/signout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/market', isAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname + '/market.html'));
});

//Most of the passport code was from this tutorial
//https://code.tutsplus.com/tutorials/authenticating-nodejs-applications-with-passport--cms-21619
function login(passport) {

    passport.use('login', new LocalStrategy({
        passReqToCallback: true
    },
        function (req, username, password, done) {
            // check in mongo if a user with username exists or not
            Client.findOne({
                'username': username
            },
                function (err, user) {
                    // In case of any error, return using the done method
                    if (err)
                        return done(err);
                    // Username does not exist, log the error and redirect back
                    if (!user) {
                        console.log('User Not Found with username ' + username);
                        return done(null, false, req.flash('message', 'User Not found.'));
                    }
                    // User exists but wrong password, log the error
                    if (!isValidPassword(user, password)) {
                        console.log('Invalid Password');
                        return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
                    }
                    // User and password both match, return user from done method
                    // which will be treated like success
                    console.log("LOGGED IN");
                    return done(null, user);
                }
            );

        }));


    const isValidPassword = function (user, password) {
        return bCrypt.compareSync(password, user.password);
    }

}

function signup(passport) {

    passport.use('signup', new LocalStrategy({
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
        function (req, username, password, done) {

            findOrCreateUser = function () {
                // find a user in Mongo with provided username
                Client.findOne({
                    'username': username
                }, function (err, user) {
                    // In case of any error, return using the done method
                    if (err) {
                        console.log('Error in SignUp: ' + err);
                        return done(err);
                    }
                    // already exists
                    if (user) {
                        console.log('User already exists with username: ' + username);
                        return done(null, false, req.flash('message', 'User Already Exists'));
                    } else {
                        // if there is no user with that email
                        // create the user
                        const newUser = new Client({
                            username: username,
                            password: createHash(password)
                        });

                        // save the user
                        newUser.save(function (err) {
                            if (err) {
                                console.log('Error in Saving user: ' + err);
                                throw err;
                            }
                            console.log('User Registration succesful');
                            return done(null, newUser);
                        });
                    }
                });
            };
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            process.nextTick(findOrCreateUser);
        }));

    // Generates hash using bCrypt
    const createHash = function (password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

}

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    // if the user is not authenticated then redirect him to the home page
    res.redirect('/');
}

// const test = new Client({
//     id: "0x3e4Ed5623Ee2ceC10DDaFC67277dA0A94D08dc80",
//     trans: [
//         { source: "0x3e4Ed5623Ee2ceC10DDaFC67277dA0A94D08dc80", quantity: 5, destination: "0x3e4Ed5623Ee2ceC10DDaFC67277dA0A94D08dc80" },
//         {source:"0x3e4Ed5623Ee2ceC10DDaFC67277dA0A94D08dc80", quantity:5, destination:"0x3e4Ed5623Ee2ceC10DDaFC67277dA0A94D08dc80"}
//     ]
// })

// test.save(function (err, client, count) {
//     console.log('made me some test', client, count, err);
// });

const port = process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ' + port);
open('http://localhost:5000/home');
