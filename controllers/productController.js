const Product = require('../models/Product')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const path = require('path')

const createProduct = async (req, res) => {
    req.body.user = req.user.userId
    const product = await Product.create(req.body)
    return res.status(StatusCodes.CREATED).json({ product })
}

const getAllProducts = async (req, res) => {
    const products = await Product.find({})
    return res.status(StatusCodes.OK).json({ products })
}

const getSingleProduct = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id }).populate('reviews')
    if (!product) {
        throw new CustomError.NotFoundError('No product found')
    }
    return res.status(StatusCodes.OK).json({ product })
}

const updateProduct = async (req, res) => {
    const product = await Product.findOneAndUpdate({ _id: req.params.id }, req.body, {
        returnDocument: 'after',
        runValidators: true
    })
    if (!product) {
        throw new CustomError.NotFoundError(`No product with id : ${productId}`)
    }
    return res.status(StatusCodes.OK).json({ product })
}

const deleteProduct = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id })
    if (!product) {
        throw new CustomError.NotFoundError(`No product with id : ${productId}`)
    }
    await product.remove()
    return res.status(StatusCodes.OK).json({ msg: 'Success! Product removed' })
}

const uploadImage = async (req, res) => {
    if (!req.files) {
        throw new CustomError.BadRequestError('No file uploaded')
    }
    const productImage = req.files.image
    if (!productImage.mimetype.startsWith('image')) {
        throw new CustomError.BadRequestError('Please upload image')
    }
    const maxSize = 1024 * 1024
    if (productImage.size > maxSize) {
        throw new CustomError.BadRequestError('Please upload image smaller than 1mb')
    }
    const imagePath = path.join(__dirname, '../public/uploads/' + `${productImage.name}`)
    await productImage.mv(imagePath)
    return res.status(StatusCodes.OK).json({ image: `/uploads/${productImage.name}` })
}

module.exports = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
    uploadImage
}