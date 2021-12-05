const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')
const cors = require('cors')

const shopRoute = require('./routes/shop')
// const productRoute = require('./routes/product')

const DB_HOST = process.env.DB_HOST || 'mongodb://localhost/shop_db'
const PORT = process.env.PORT || 3000

const app = express()

app.use(express.static('images'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan('dev'))
app.use(cors())

app.use('/', shopRoute)
// app.use('/shops', shopRoute)
// app.use('/products', productShop)

app.use((err, req, res, next) => {
    console.log(err)
    if (err instanceof jwt.JsonWebTokenError) {
        res.sendStatus(401)
        return
    }
    res.status(500).send(err.message)
})

mongoose.connect(DB_HOST, err => {
    if (err) {
        console.error(err)
        return
    }
    app.listen(PORT, () => console.log(`server started at port ${PORT}`))
})