const express = require('express');
const { 
    userById, 
    getAllUsers, 
    getUser, 
    updateUser, 
    deleteUser, 
    getProfileImage,
    addFollowing,
    addFollower,
    removeFollowing,
    removeFollower,
    findPeople,
    updateBackgroundImage,
    getBackgroundImage
    
} = require('../controllers/userController');

const { requireSignIn } = require('../controllers/authController');

const route = express.Router();

route.put('/user/follow', requireSignIn, addFollowing, addFollower);
route.put('/user/unfollow', requireSignIn, removeFollowing, removeFollower);

route.get('/users', getAllUsers);
route.get('/user/:userId', requireSignIn, getUser);
route.put('/user/:userId', requireSignIn, updateUser);
route.delete('/user/:userId', requireSignIn, deleteUser);

route.get('/user/photo/:userId', getProfileImage);

// route.get('user/backgroundPhoto/:userId', requireSignIn, getBackgroundImage);
route.post('/user/backgroundPhoto/:userId', requireSignIn, updateBackgroundImage);

route.get('/user/findpeople/:userId', requireSignIn, findPeople);


//Catch userId parameter in url
route.param("userId", userById);

module.exports = route;