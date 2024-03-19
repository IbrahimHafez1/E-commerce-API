const User = require("../models/user")
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const { attachCookiesToResponse, createTokenUser } = require('../utils')

const register = async (req, res) => {
    const { name, email, password } = req.body

    const isFirstAccount = await User.countDocuments({}) === 0
    const role = isFirstAccount ? 'admin' : 'user'

    const user = await User.create({ name, email, password, role })

    const tokenUser = createTokenUser(user)
    attachCookiesToResponse({ res, user: tokenUser })
    return res.status(StatusCodes.CREATED).json({ user: tokenUser })
}

const login = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        throw new CustomError.BadRequestError('Please provide email and password')
    }
    const user = await User.findOne({ email })
    if (!user) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials')
    }
    const isPasswordCorrect = await user.matchPassword(password)
    if (!isPasswordCorrect) {
        throw new CustomError.UnauthenticatedError('Invalid Credentials')
    }
    const tokenUser = createTokenUser(user)
    attachCookiesToResponse({ res, user: tokenUser })
    return res.status(StatusCodes.OK).json({ user: tokenUser })
}

const logout = async (req, res) => {

    res.cookie('token', 'logout', {
        httpOnly: true,
        expires: new Date(0)
    })
    return res.status(StatusCodes.OK).json({ msg: 'user logged out!' })
}

module.exports = {
    register,
    login,
    logout
}