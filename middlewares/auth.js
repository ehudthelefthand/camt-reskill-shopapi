const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')

const Shop = require('../models/shop')

const SECRET = process.env.SECRET || 'secret'

module.exports = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
        res.sendStatus(401)
        return
    }

    const token = authHeader.slice('Bearer '.length)
    if (!token) {
        res.sendStatus(401)
        return
    }

    const claim = jwt.verify(token, SECRET)
    const shop = await Shop.findOne({ remember: claim.remember }).exec()
    if (!shop) {
        res.sendStatus(401)
        return
    }

    req.Shop = shop
    
    next()
})