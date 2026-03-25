const mongoose = require('mongoose');
const argon2 = require('argon2');
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true
    },
    password:{
        type:String,
        required:true,
    },
    notificationPreference: [String]
},{timestamps: true});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    this.password = await argon2.hash(this.password);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw error;
    }
};

userSchema.index({ username: 'text' });

const User = mongoose.model('User',userSchema);
module.exports = User;
