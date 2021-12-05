const express = require('express')
const asyncHandler = require('express-async-handler')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const Product = require('../models/product')
const auth = require('../middlewares/auth')

const router = express.Router()
const PHOTO_PATH = 'images/products/'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PHOTO_PATH)
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`)
    },
})
const upload = multer({ 
    storage, 
    limits: {
        fileSize: 1000 * 1000 * 2 // 2 MB
    }
})

router.post('/', auth, upload.single('photo'), asyncHandler(async (req, res) => {
    const shop = req.Shop
    const { 
        name,
        description,
        price,
    } = req.body
    const product = new Product({ 
        name,
        description,
        price: Number(price),
        shop: shop._id,
    })

    if (req.file && req.file.filename) {
        product.photo = req.file.filename
    }

    await product.save()

    res.sendStatus(201)
}))

router.put('/:productId', auth, upload.single('photo'), asyncHandler(async (req, res) => {
    const productId = req.params.productId
    if (!productId) {
        res.sendStatus(404)
        return
    }

    const product = await Product.findById(productId).exec()
    if (!product) {
        res.sendStatus(404)
        return
    }

    const { name, description, price } = req.body
    if (name) {
        product.name = name
    }
    if (description) {
        product.description = description
    }
    if (price) {
        product.price = Number(price)
    }
    await product.save()
    if (req.file && req.file.filename) {
        const oldfilename = product.photo
        product.photo = req.file.filename
        await product.save()
        if (oldfilename) {
            try {
                fs.unlinkSync(path.resolve(__dirname, '..', PHOTO_PATH, oldfilename.split('/').at(-1)))
            } catch {
                console.log('file not found but it is ok.')
            }
        }
    }
    res.sendStatus(204)
}))

router.delete('/:productId', auth, asyncHandler(async (req, res) => {
    const productId = req.params.productId
    if (productId) {
        await Product.findByIdAndRemove(req.params.productId)
        res.sendStatus(204)
        return
    }
    res.sendStatus(404)
}))

router.get('/:productId', asyncHandler(async (req, res) => {
    const product = await Product
        .findById(req.params.productId)
        .populate('shop', 'name description category')
        .exec()
    res.json(product)
}))

router.get('/', asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const search = req.query.search || '.*'
    const products = await Product
        .find({ name: { $regex: search, $options: 'i' } })
        .skip((page-1) * limit)
        .limit(limit)
        .exec()
    res.json(products)
}))

module.exports = router