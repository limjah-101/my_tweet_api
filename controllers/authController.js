const User = require('../models/user');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
require('dotenv').config();
const _ = require ('lodash');
const { sendEmail } = require('../helpers');

/**
 * Find User by EMAIL
 * if User exists return Error msg
 * else create new User
 */
exports.createUser = async (req, res) => {
    const userExists = await User.findOne({ email: req.body.email });
    
    if (userExists) {
        return res.status(403).json({
            error: "Sorry, this email is already taken!"
        });
    }
    const user = await new User(req.body);
    await user.save();
    res.status(200).json({ message: "Account was created successfuly" });
}

exports.signIn = (req, res) => {
    //Find User by Email
    const { email, password } = req.body;

    User.findOne( { email: email}, (err, user) => {
        //if no User found -> suggest SignIn
        if (err || !user) {
            return res.status(401).json({
                error: "User doesn't exist. Please Sign Up."
            })
        }
        //if User -> check && match email - pwd
        //authenticate methods userModel
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: "Email and password do not match."
            })
        }
        //Generate TOKEN with UserID && Secret
        const token = jwt.sign({ _id: user.id }, process.env.JWT_SECRET);
        //Persist token in COOKIE with exp date (available in response) 
        res.cookie("token", token, { expire: new Date() + 9999 })
        //return RES && Make COOKIE available for CLIENT
        const { _id, name, email } = user
        return res.json({ token, user: { _id, name, email } });
    })
}

exports.signOut = (req, res) => {

    res.clearCookie("token")
    return res.status(200).json({
        message: "SignOut successfully"
    });
}

//Check authorization token in Request Header
exports.requireSignIn = expressJwt({
    //if token -> append express-jwt verified User_id in auth key to req
    secret: process.env.JWT_SECRET,
    userProperty: "auth"
});


exports.forgotPassword = (req, res) => {
    if (!req.body) return res.status(400).json({ message: "No request body" });
    if (!req.body.email)
        return res.status(400).json({ message: "No Email in request body" });
 
    console.log("forgot password finding user with that email");
    const { email } = req.body;
    console.log("signin req.body", email);
    // find the user based on email
    User.findOne({ email }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "User with that email does not exist!"
            });
 
        // generate a token with user id and secret
        const token = jwt.sign(
            { _id: user.id, iss: "lemur_zone_jwt" },
            process.env.JWT_SECRET
        );
 
        // email data
        const emailData = {
            from: "noreply@node-react.com",
            to: email,
            subject: "Password Reset Instructions",
            text: `Please use the following link to reset your password: ${
                process.env.CLIENT_URL
            }/reset-password/${token}`,
            html: `<p>Please use the following link to reset your password:</p> <p>${
                process.env.CLIENT_URL
            }/reset-password/${token}</p>`
            
        };
 
        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ message: err });
            } else {
                sendEmail(emailData);
                return res.status(200).json({
                    message: `Email has been sent to ${email}. Follow the instructions to reset your password.`
                });
            }
        });
    });
};
 
// to allow user to reset password
// first you will find the user in the database with user's resetPasswordLink
// user model's resetPasswordLink's value must match the token
// if the user's resetPasswordLink(token) matches the incoming req.body.resetPasswordLink(token)
// then we got the right user
 
exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;
 
    User.findOne({ resetPasswordLink }, (err, user) => {
        // if err or no user
        if (err || !user)
            return res.status("401").json({
                error: "Invalid Link!"
            });
 
        const updatedFields = {
            password: newPassword,
            resetPasswordLink: ""
        };
 
        user = _.extend(user, updatedFields);
        user.updated = Date.now();
 
        user.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({
                message: `Great! Now you can login with your new password.`,                
            });
        });
    });
};

/**
 *  SOCIAL LOGIN METHOD
 * CHECK USER EMAIL THEN SIGN IN
 */
exports.socialLogin = (req, res) => {
    // try signup by finding user with req.email
    console.log(req.body);
    let user = User.findOne({ email: req.body.email }, (err, user) => {
        if (err || !user) {
            // create a new user and login
            user = new User(req.body);
            req.profile = user;
            user.save();

            // generate a token with user id and secret
            const token = jwt.sign(
                { _id: user._id, iss: "lemur_zone_jwt" },
                process.env.JWT_SECRET
                
            );
            res.cookie("token", token, { expire: new Date() + 9999 });

            // return response with user and token to frontend client
            const { _id, name, email } = user;
            return res.json({ token, user: { _id, name, email } });
        } else {

            // update existing user with new social info and login
            req.profile = user;
            user = _.extend(user, req.body);
            user.updated = Date.now();
            user.save();

            // generate a token with user id and secret
            const token = jwt.sign(
                { _id: user._id, iss: "lemur_zone_jwt" },
                process.env.JWT_SECRET
            );
            res.cookie("token", token, { expire: new Date() + 9999 });
            
            // return response with user and token to frontend client
            const { _id, name, email } = user;
            return res.json({ token, user: { _id, name, email } });
        }
    });
};