const express = require('express')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const crypto = require('crypto')
const Shop = require('../models/shop')
const auth = require('../middlewares/auth')
const Product = require('../models/product')
const product = require('../models/product')

const SECRET = process.env.SECRET || 'secret'

const router = express.Router()
const PHOTO_PATH = 'images/shops/'

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

router.post('/register', upload.single('photo'), asyncHandler(async (req, res) => {
    const { 
        name,
        description,
        category,
        email,
        password
    } = req.body
    const saltRound = 10
    const passwordHash = await bcrypt.hash(password, saltRound)
    const shop = new Shop({ 
        name,
        description,
        category,
        email,
        password: passwordHash, 
    })

    if (req.file && req.file.filename) {
        shop.photo = req.file.filename
    }

    await shop.save()

    res.sendStatus(201)
}))

router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const shop = await Shop.findOne({ email }).select("+password").exec()
    if (!shop) {
        res.sendStatus(401)
        return
    }

    const valid = await bcrypt.compare(password, shop.password)
    if (!valid) {
        res.sendStatus(401)
        return
    }

    const remember = crypto.randomBytes(32).toString('hex')
    shop.remember = remember
    await shop.save()

    const token = jwt.sign({
        remember,
    }, SECRET)

    res.json({ token })
}))

router.get('/myshop', auth, asyncHandler(async (req, res) => {
    const { 
        _id,
        name,
        description, 
        category, 
        photo,
        email
    } = req.Shop

    const profile = {
        _id,
        name,
        description, 
        category, 
        photo,
        email
    }

    res.json(profile)
}))

router.put('/myshop', auth, upload.single('photo'), asyncHandler(async (req, res) => {
    const shop = req.Shop
    const { name, description, category } = req.body
    if (name) {
        shop.name = name
    }
    if (description) {
        shop.description = description
    }
    if (category) {
        shop.category = category
    }
    await shop.save()
    if (req.file && req.file.filename) {
        const oldfilename = shop.photo
        shop.photo = req.file.filename
        await shop.save()
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

router.get('/shops', asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const search = req.query.search || '.*'
    const total = await Shop.count().exec()
    const shops = await Shop
        .find({ name: { $regex: search, $options: 'i' } })
        .skip((page-1) * limit)
        .limit(limit)
        .exec()
    res.json({
        data: shops,
        total
    })
}))

router.get('/shops/:shopId', asyncHandler(async (req, res) => {
    const shop = await Shop.findById(req.params.shopId).exec()
    if (!shop) {
        res.sendStatus(404)
        return
    }
    res.json(shop)
}))

router.get('/shops/:shopId/products', asyncHandler(async (req, res) => {
    const shop = await Shop.findById(req.params.shopId).exec()
    if (!shop) {
        res.sendStatus(404)
        return
    }
    const total = await Product
        .find({ shop: shop._id })
        .count()
        .exec()
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const products = await Product
        .find({ shop: shop._id })
        .skip((page-1) * limit)
        .limit(limit)
        .exec()
    res.json({ 
        data: products,
        total
    })
}))

router.delete('/shops/:shopId', asyncHandler(async (req, res) => {
    if (req.params.shopId) {
        await Shop.deleteOne({ _id: req.params.shopId })
        res.sendStatus(204)
        return
    }
    res.sendStatus(404)
}))

router.post('/logout', auth, asyncHandler(async (req, res) => {
    const shop = req.Shop
    await Shop.findByIdAndUpdate(shop._id, { $unset: { remember: 1 } })    
    res.sendStatus(204)
}))

module.exports = router