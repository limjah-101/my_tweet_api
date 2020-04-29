const User = require('../models/user');
const BckImg = require('../models/bckImg');
const _ = require('lodash');
const fs = require('fs');
const formidable = require('formidable');

/**
 * Find User by Id -> if User ? append user Infos in REQ : err
 */
exports.userById = (req, res, next, id) => {
    User.findById(id)
    //Populate Follow's Lists with Id & Name Fields
    .populate('following', '_id name')
    .populate('followers', '_id name')
    .exec( (err, user) => {
        if(err || !user){
            return res.status(400).json({
                error: "Sorry, no such User found!"
            })
        }
        //Append User info in request profile
        req.profile = user;
        next();
    });
};

exports.isAuthorized = (req, res, next) => {
    const authorized = req.profile && req.auth && req.profile._id === req.auth._id;
    if (!authorized) {
        return res.status(403).json({
            error: "You are not allowed to perform this action!"
        });
    }
}

/**
 * fetch all users
 */
 exports.getAllUsers = (req, res) => {
    
    User.find().select("_id name email created updated")
        .then( users => {
            res.json({ users: users })
        })
        .catch(err => res.json({ error: "Sorry, no users found" }))
}
/**
 * find User by Id && filter the result
 */
exports.getUser = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    req.profile.__v = undefined;
    return res.json(req.profile);
}

/**
 * get user data in req.profile
 * if update -> get change data : stick on req.profile data -> save to DB.
 * filter response
 */
exports.updateUser = (req, res, next ) => {
    
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({ error: "Photo could not be uploaded" })
        }
        
        let user = req.profile;
        //Override User's info if data changes
        user = _.extend(user, fields);
        user.updated = Date.now();

        //Handle File
        if (files.photo) {
            user.photo.data = fs.readFileSync(files.photo.path);
            user.photo.contentType = files.photo.type;
        }

        user.save( (err, result) => {
            if (err) {
                return res.status(400).json({
                    error: "Sorry, you are not authorised to perform this action."
                })
            }
            user.hashed_password = undefined;
            user.salt = undefined;
            user.__v = undefined;
    
            res.json(
                { 
                    user,
                    // message: "User profile was updated successfuly!" 
                })
        })
    })    
}

exports.deleteUser = (req, res, next) => {
    let user = req.profile;
    user.remove( (err, user) => {
        if (err) {
            return res.status(400).json({
                error: err
            })
        }
        res.json({
            // user: user,
            message: "Your account was successfuly deleted."
        })
    })
}

/**
 * Get User profile an background Image
 */
exports.getProfileImage = (req, res, next) => {
    if (req.profile.photo.data) {
        res.set({
            "Content-Type": req.profile.photo.contentType            
        })
        return res.send(req.profile.photo.data)
    }
    next();        
}


/**
 * 
 */
exports.addFollowing = (req, res, next) => {

    User.findByIdAndUpdate(
        req.body.userId,
        //
        { $push: { following: req.body.followId } },
        ( err, result ) => {
            if (err){
                return res.status(400).json({  error: err})
            }
            next();
        }
    );
}

/**
 * 
 */
exports.addFollower = (req, res) => {

    User.findByIdAndUpdate(
        req.body.followId,
        //
        { $push: { followers: req.body.userId } },
        //Tell MongoDB to respond with the latest updated DATA
        { new: true },        
    )
    .populate('following', '_id name')
    .populate('followers', '_id name')
    .exec( (err, result) => {
        if (err){
            res.status(400).json({ error: err })
        }
        result.hashed_password = undefined;
        result.salt = undefined;
        // result.__v = undefined;
        res.json(result);
    });
}

/**
 * REMOVE FOLLOWINNG USER (unfollowId)
 */
exports.removeFollowing = (req, res, next) => {

    User.findByIdAndUpdate(
        req.body.userId,
        //
        { $pull: { following: req.body.unfollowId } },
        ( err, result ) => {
            if (err){
                return res.status(400).json({  error: err})
            }
            next()
        }
    );
}

 /**
  * REMOVE FOLLOWER USER (userId)
  */
 exports.removeFollower = (req, res) => {

    User.findByIdAndUpdate(
        req.body.unfollowId,
        //
        { $pull: { followers: req.body.userId } },
        //Tell MongoDB to respond with the latest updated DATA
        { new: true },        
    )
    .populate('following', '_id name')
    .populate('followers', '_id name')
    .exec( (err, result) => {
        if (err){
            res.status(400).json({ error: err })
        }
        result.hashed_password = undefined;
        result.salt = undefined;
        // result.__v = undefined;
        res.json(result);
    })
}

/**
 * FIND PEOPLE WHO TO FOLLOW 
 */
exports.findPeople = (req, res) => {
    let following = req.profile.following;
    following.push(req.profile._id);
    // Find all User's ids whosn't following
    User.find({ _id: { $nin: following }}, (err, notFollowing) => {
        if (err){
            res.status(400).json({ error: err });
        }        
        res.json( { data: notFollowing } );
    }).select("name");

}

// exports.getBackgroundImage = (req, res, next, id) => {
//     BckImg.find({ user: `${id}` })
//         .exec((err, img) => {
//             if (err){
//                 res.status(400).json({
//                     error: "Sorry, no backgroun image found"
//                 })
//             }
//             res.json(img)
//         })
// }

exports.updateBackgroundImage = (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse( req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: err
            })
        }
        let bckImg = new BckImg(fields);    
             
        bckImg.user = req.profile;

        if (files.photo){
            bckImg.photo.data = fs.readFileSync(files.photo.path);
            bckImg.photo.contentType = files.photo.path;
        }

        bckImg.save( (err, result) => {
            if (err){
                return res.status(400).json({
                    error: err
                })
            }
            res.json(result)
        })
    } )
}


