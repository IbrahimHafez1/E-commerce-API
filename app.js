const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const connectDB = require('./db/connect')
const dotenv = require('dotenv')
const notFoundMiddleware = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')
const rateLimiter = require('express-rate-limit')
const helmet = require('helmet')
const xss = require('xss-clean')
const mongoSanitize = require('express-mongo-sanitize')
const cors = require('cors')
require('express-async-errors')

const authRouter = require('./routes/authRoutes')
const userRouter = require('./routes/userRoutes')
const productsRouter = require('./routes/productRoutes')
const reviewsRouter = require('./routes/reviewRoutes')
const orderRouter = require('./routes/orderRoutes')

dotenv.config()

app.use(express.json())
app.use(morgan('tiny'))
app.use(cookieParser(process.env.JWT_SECRET))
app.use(express.static('./public'))
app.use(fileUpload({
    useTempFiles: true
}))
app.use(rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60
}))
app.use(helmet())
app.use(xss())
app.use(mongoSanitize())
app.use(cors())
app.set('trustProxy', 1)

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.get('/api/v1', (req, res) => {
    console.log(req.signedCookies)
    res.send('Hello World!')
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/products', productsRouter)
app.use('/api/v1/reviews', reviewsRouter)
app.use('/api/v1/orders', orderRouter)

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI)
        app.listen(port, () => {
            console.log(`app listening on port ${port}`)
        })
    } catch (error) {
        console.log(error);
    }
}

start()