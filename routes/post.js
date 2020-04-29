const express = require("express");
const { 
    getPosts, 
    createPost, 
    postByUser, 
    postById, 
    updatePost, 
    isPoster, 
    deletePost, 
    getPostPhoto, 
    singlePost,
    like,
    unlike,
    comment,
    uncomment
} = require("../controllers/postController");
const { requireSignIn } = require("../controllers/authController");
const { userById } = require('../controllers/userController');
const validator = require('../validator');

const router = express.Router();

router.get("/posts", getPosts);

//LIKES
router.put("/post/like", requireSignIn, like);
router.put("/post/unlike", requireSignIn, unlike);

//COMMENTS
router.put("/post/comment", requireSignIn, comment);
router.put("/post/uncomment", requireSignIn, uncomment);

//Middleware Order : signedIn user then create post then validator
router.post(
    "/post/new/:userId", 
    requireSignIn,
    createPost,
    validator.createPostValidator
);
router.get("/posts/by/:userId", requireSignIn, postByUser);
router.get("/post/:postId", singlePost);
router.put("/post/:postId", requireSignIn, updatePost);
router.delete("/post/:postId", requireSignIn, isPoster, deletePost);

//Photo
router.get("/post/photo/:postId", getPostPhoto);



router.param('postId', postById);
router.param('userId', userById);

module.exports = router;