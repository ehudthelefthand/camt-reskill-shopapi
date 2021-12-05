const mongoose = require('mongoose')

const shopSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    category: {
        type: String,
        trim: true,
        required: true
    },
    photo: {
        type: String,
        trim: true,
        get: photoPath
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    remember: {
        type: String,
        select: false,
    }
})

function photoPath(photo) {
    if (photo) {
        return `/shops/${photo}`
    }
}

shopSchema.set('toObject', { getters: true })

module.exports = mongoose.model('Shop', shopSchema)