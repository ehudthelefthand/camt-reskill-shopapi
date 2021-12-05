const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new mongoose.Schema({
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
    price: {
        type: Number,
        required: true
    },
    photo: {
        type: String,
        trim: true,
        get: photoPath
    },
    shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    }
})

function photoPath(photo) {
    if (photo) {
        return `/products/${photo}`
    }
}

productSchema.set('toObject', { getters: true })
productSchema.set('toJSON', { getters: true })

module.exports = mongoose.model('Product', productSchema)