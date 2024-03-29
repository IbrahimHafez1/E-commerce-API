const Product = require('../models/Product')
const Review = require('../models/Review')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const { checkPermissions } = require('../utils')

const createReview = async (req, res) => {
    const { product: productId } = req.body
    req.body.user = req.user.userId
    isValidProduct = await Product.findOne({ _id: productId })
    if (!isValidProduct) {
        throw new CustomError.NotFoundError(`No product with id : ${productId}`)
    }

    const alreadySubmitted = await Review.findOne({
        product: productId,
        user: req.user.userId
    })

    if (alreadySubmitted) {
        throw new CustomError.BadRequestError('Already submitted review')
    }

    const review = await Review.create(req.body)
    return res.status(StatusCodes.CREATED).json({ review })

}
const getAllReviews = async (req, res) => {
    const reviews = await Review.find({}).populate({ path: 'product', select: 'name company price' }).populate({ path: 'user', select: 'name' })
    return res.status(StatusCodes.OK).json({ reviews })
}
const getSingleReview = async (req, res) => {
    const { id: reviewId } = req.params
    const review = await Review.findOne({ _id: reviewId })
    if (!review) {
        throw new CustomError.NotFoundError(`No review with id : ${reviewId}`)
    }
    return res.status(StatusCodes.OK).json({ review })

}
const updateReview = async (req, res) => {
    const { id: reviewId } = req.params
    const { rating, title, comment } = req.body
    const review = await Review.findOne({ _id: reviewId })
    if (!review) {
        throw new CustomError.NotFoundError(`No review with id : ${reviewId}`)
    }
    checkPermissions(req.user, review.user)
    review.rating = rating
    review.title = title
    review.comment = comment
    await review.save()
    return res.status(StatusCodes.OK).json({ review })

}
const deleteReview = async (req, res) => {
    const { id: reviewId } = req.params
    const review = await Review.findOne({ _id: reviewId })
    if (!review) {
        throw new CustomError.NotFoundError(`No review with id : ${reviewId}`)
    }
    checkPermissions(req.user, review.user)

    await review.remove()
    return res.status(StatusCodes.OK).json({ msg: 'Success! Review removed' })
}

const getSingleProductReviews = async (req, res) => {
    const { id: productId } = req.params
    const reviews = await Review.find({ product: productId })
    if (!reviews) {
        throw new CustomError.NotFoundError(`No review with id : ${productId}`)
    }
    return res.status(StatusCodes.OK).json({ reviews })
}

module.exports = {
    createReview,
    getAllReviews,
    getSingleReview,
    updateReview,
    deleteReview,
    getSingleProductReviews
}