const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema;

const bckImgSchema = new mongoose.Schema({
    title:{
        type: String
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    user:{
        type: ObjectId,
        ref: "User"
    }
});
module.exports = mongoose.model("bckImg", bckImgSchema)