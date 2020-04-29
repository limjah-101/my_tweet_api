const mongoose = require('mongoose');
const uuidv1 = require('uuid/v1');
const crypto = require('crypto');

const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true
    },
    about: {
        type: String
    },
    hashed_password: {
        type: String,
        required: true
    },
    resetPasswordLink: {
        data: String,
        default: ""
    },
    salt: String,
    created: {
        type: Date,
        default: Date.now
    },
    updated: Date,
    photo: {
        data: Buffer,
        contentType: String
    },    
    website: String,
    address: String,
    following: [{ type: ObjectId, ref: "User" }],
    followers: [{ type: ObjectId, ref: "User" }]

});

userSchema.virtual('password')
.set(function (password) {
    this._password = password;
    //Generate timestamp
    this.salt = uuidv1();
    this.hashed_password = this.encryptPassword(password);
})
.get(function() {
    return this._password;
});

//<<<<<<<<<<<<<<<<<<<<<<<<<<<METHODS>>>>>>>>>>>>>>>>>>>>>>>
userSchema.methods = {
    //AUTHENTICATE USER
    authenticate: function(plainTextPwd) {
        return this.encryptPassword(plainTextPwd) === this.hashed_password;
    },

    //ENCRYPT PWD -> SHA1 + "UUIDSALT"
    encryptPassword: function(password) {
        if (!password) {
            return "";
        }
        try {
            return crypto.createHmac('sha1', this.salt)
                        .update(password)
                        .digest('hex');
        }
        catch(err) {
            return "";
        }
    }
};

module.exports = mongoose.model("User", userSchema);