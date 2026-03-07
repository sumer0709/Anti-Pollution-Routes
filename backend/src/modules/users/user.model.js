const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String
    },
    email:{
        type: String,
        unique: true
    },
    notificationPreference: [String]
},{timestamps: true});

const UserRoute = mongoose.model('UserRoute',userSchema);
module.exports = UserRoute;