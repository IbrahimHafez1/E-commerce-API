const Order = require('../models/Order')
const Product = require('../models/Product')
const { checkPermissions } = require('../utils')
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')

const fakeStripeAPI = async ({ amount, currency }) => {
    const client_secret = 'someRandomValue';
    return { client_secret, amount };
};


const createOrder = async (req, res) => {
    const { items: cartItems, tax, shippingFee } = req.body;

    if (!cartItems || cartItems.length < 1) {
        throw new CustomError.BadRequestError('No cart items provided');
    }
    if (!tax || !shippingFee) {
        throw new CustomError.BadRequestError(
            'Please provide tax and shipping fee'
        );
    }

    let orderItems = [];
    let subtotal = 0;

    for (const item of cartItems) {
        const dbProduct = await Product.findOne({ _id: item.product });
        if (!dbProduct) {
            throw new CustomError.NotFoundError(
                `No product with id : ${item.product}`
            );
        }
        const { name, price, image, _id } = dbProduct;
        const singleOrderItem = {
            amount: item.amount,
            name,
            price,
            image,
            product: _id,
        };
        // add item to order
        orderItems = [...orderItems, singleOrderItem];
        // calculate subtotal
        subtotal += item.amount * price;
    }
    // calculate total
    const total = tax + shippingFee + subtotal;
    // get client secret
    const paymentIntent = await fakeStripeAPI({
        amount: total,
        currency: 'usd',
    });

    const order = await Order.create({
        orderItems,
        total,
        subtotal,
        tax,
        shippingFee,
        clientSecret: paymentIntent.client_secret,
        user: req.user.userId,
    });

    res
        .status(StatusCodes.CREATED)
        .json({ order, clientSecret: order.clientSecret });
};

const getAllOrders = async (req, res) => {
    const orders = await Order.find({})
    return res.status(StatusCodes.OK).json({ orders })
}

const getSingleOrder = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id })
    if (!order) {
        throw new CustomError.NotFoundError(`No order with id : ${req.params.id}`)
    }
    checkPermissions(req.user, order.user)
    return res.status(StatusCodes.OK).json({ order })
}

const getCurrentUserOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user.userId })
    if (!orders) {
        throw new CustomError.NotFoundError('No order found')
    }
    return res.status(StatusCodes.OK).json({ orders })
}

const updateOrder = async (req, res) => {
    const { paymentIntentId } = req.body
    const order = await Order.findOne({ _id: req.params.id })
    if (!order) {
        throw new CustomError.NotFoundError(`No order with id : ${req.params.id}`)
    }
    checkPermissions(req.user, order.user)
    order.paymentIntentId = paymentIntentId
    order.status = 'paid'
    await order.save()
    return res.status(StatusCodes.OK).json({ order })
}

module.exports = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    getCurrentUserOrders,
    updateOrder
}