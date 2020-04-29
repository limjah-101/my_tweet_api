const express = require('express');

const { createUser, signIn, signOut, resetPassword, forgotPassword, socialLogin } = require('../controllers/authController');
const { userById } = require('../controllers/userController');
const { createUserValidator, passwordResetValidator } =require('../validator');

const router = express.Router();

//SOCIAL LOGIN ROUTE
router.post("/social-login", socialLogin);

//PASSWORD RESET NOT WORKING YET
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", passwordResetValidator, resetPassword);

router.post(
    '/register', 
    createUserValidator, 
    createUser
);

router.post( '/login', signIn );

router.get( '/logout', signOut );
//Any routes witch contain userId as url's param -> execute userByID() in userController
router.param('userId', userById);

module.exports = router;