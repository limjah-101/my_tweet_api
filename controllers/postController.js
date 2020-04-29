const Post = require('../models/post');
//Handle file uploads
const fs = require('fs');
const formidable = require('formidable');
const _ = require('lodash');


/**
 * query Post by Id then append res.post property to the response
 */
const postById = (req, res, next, id) => {
    Post.findById(id)
        .populate("postedBy", "_id name")        
        .populate("comments.postedBy", "_id name")
        .exec((err, post) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }
            req.post = post
            next();
        });
}

/**
 * 
 */
const singlePost = (req, res) => {    
    return res.json(req.post);    
}

/**
 * RETURN ALL POSTS COLLECTION'S FIELDS
 * WITH FILTERED USER COLLECTION (userId, name)
 * AND POSTS COMMENTS FIELDS && postedBy (UserData)
 * ORDER BY CREATED "DESC"
 */
const getPosts = (req, res) => {
    Post.find()
        .populate("postedBy", "_id name")
        .populate("comments", "text created")
        .populate("comments.postedBy", "_id name")
        .select("_id title body created likes ")
        .sort({ created: -1 })
        .then( result => {
            res.json({
                posts: result
            });
        })
        .catch( err => console.log(err))
};

/**
 * Get frontEnd request
 * Handle file Uploads
 * HANDLE COLLECTION'S RELATION (POST -- USER)
 */
const createPost = (req, res) => {
    
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;    
    form.parse( req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: "Sorry, image could not be uploaded."
            })
        }
        let post = new Post(fields)        
        //Filter returned data
        req.profile.salt = undefined;
        req.profile.hashed_password = undefined;
        req.profile.__v = undefined;
        post.postedBy = req.profile;        
        //Handle file
        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.path);
            post.photo.contentType = files.photo.path;         
        }
        post.save( (err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }            
            res.json(result)
        });
    });   
};

/**
 * RETURN ONLY USER'S POSTS
 * WITH FILTERED USER COLLECTION (userId, name)
 * ORDER BY CREATED
 */
const postByUser = (req, res, next) => {
    Post.find({ postedBy: req.profile._id })
        .populate("postedBy", "_id name")
        .select("_id title body created likes")
        .sort("_created")
        .exec((err, post) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }
            res.json(post)
        })
};

/**
 * UPDATE A POST
 * HANDLE SINGLE IMAGE UPLOAD
 * RETURN NEW UPDATED COLLECTION
 */
const updatePost = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({ error: "Photo could not be uploaded" })
        }        
        let post = req.post;        
        post = _.extend(post, fields);
        post.updated = Date.now();
        //Handle File
        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.path);
            post.photo.contentType = files.photo.type;
        }
        post.save( (err, result) => {
            if (err) {
                return res.status(400).json({
                    error: "Sorry, you are not authorised to perform this action."
                })
            }                
            res.json(
                { post })
        })
    })   
}

/**
 * ALLOW ONLY LOGGED IN USER TO PERFORM CERTAIN ACTIONS
 */
const isPoster = (req, res, next) => {
    let isUsersPost = req.post && req.auth && req.post.postedBy._id == req.auth._id;
    
    if (!isUsersPost) {
        return res.status(403).json({
            error: "Sorry, you are not allowed to perform this action."
        })
    }
    next();
};

/**
 * DELETE A POST
 */
const deletePost = (req, res) => {
    let post = req.post;    
    post.remove( err => {
        if (err) {
            return res.status(400).json({
                error: err
            });
        }
        res.json({ message: "Post was deleted successfully!" });
    })
}

const getPostPhoto = (req, res, next) => {
    res.set("Content-Type", req.post.photo.contentType)
    return res.send(req.post.photo.data)    
}

/**
 * FIND POST BY ID THEN PUUS "USERID" OUT OF LIKES ARRAY
 */

const like = (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId,
        { $push: { likes: req.body.userId } },
        { new: true }
    )
    .exec((err, result) => {
        if (err){
            return res.status(400).json({
                error: err
            })
        }else {
            res.json(result)
        }
    })
}

/**
 * FIND POST BY ID THEN PULL "USERID" OUT OF LIKES ARRAY
 */
const unlike = (req, res) => {
    Post.findByIdAndUpdate(
        req.body.postId,
        { $pull: { likes: req.body.userId } },
        { new: true }
    )
    .exec((err, result) => {
        if (err){
            return res.status(400).json({
                error: err
            })
        }else {
            res.json(result)
        }
    })
}

/**
 * FIND POST by Id THEN "PUSH" COMMENT DATA INTO POST COMMENTS  ARRAY
 * THEN RESPOND WITH USERS
 */
const comment = (req, res) => {

    let comment = req.body.comment;
    comment.postedBy = req.body.userId;

    Post.findByIdAndUpdate(
        req.body.postId,
        { $push: { comments: comment } },
        { new: true }
    )
    .populate("comments.postedBy", "_id name")
    .populate("postedBy", "_id name")
    .exec((err, result) => {
        if (err){
            return res.status(400).json({
                error: err
            })
        }else {
            res.json(result)
        }
    })
}

/**
 * 
 */
const uncomment = (req, res) => {

    let comment = req.body.comment;    

    Post.findByIdAndUpdate(
        req.body.postId,
        { $pull: { comments: { _id: comment._id } } },
        { new: true }
    )
    .populate("comments.postedBy", "_id name")
    .populate("postedBy", "_id name")
    .exec((err, result) => {
        if (err){
            return res.status(400).json({
                error: err
            })
        }else {
            res.json(result)
        }
    })
}

module.exports = {
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
}