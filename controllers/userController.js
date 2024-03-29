const User = require("../models/user")
const { StatusCodes } = require('http-status-codes')
const CustomError = require('../errors')
const { attachCookiesToResponse, createTokenUser, checkPermissions } = require('../utils')

const getAllUsers = async (req, res) => {
    const users = await User.find({ role: 'user' }).select('-password')
    if (!users) {
        throw new Error("Users not found")

    }
    return res.status(StatusCodes.OK).json({ users })
}

const getSingleUser = async (req, res) => {
    const user = await User.findOne({ _id: req.params.id }).select('-password')
    if (!user) {
        throw new CustomError.NotFoundError("User not found")
    }
    checkPermissions(req.user, user._id)
    res.status(StatusCodes.OK).json({ user })
}

const showCurrentUser = async (req, res) => {
    res.status(StatusCodes.OK).json({ user: req.user })
}

const updateUser = async (req, res) => {
    const { name, email } = req.body
    if (!name || !email) {
        throw new CustomError.BadRequestError("Please provide name and email")
    }
    const user = await User.findOne({ _id: req.user.userId })
    user.name = name
    user.email = email
    await user.save()
    const tokenUser = createTokenUser(user)
    attachCookiesToResponse({ res, user: tokenUser })
    return res.status(StatusCodes.OK).json({ user: tokenUser })
}

const updateUserPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
        throw new CustomError.BadRequestError("Please provide old and new password")
    }
    const user = await User.findOne({ _id: req.user.userId })

    const isOldPasswordCorrect = await user.matchPassword(oldPassword)
    if (!isOldPasswordCorrect) {
        throw new CustomError.UnauthenticatedError("Old password is incorrect")
    }
    user.password = newPassword

    await user.save()
    return res.status(StatusCodes.OK).json({ msg: "Password updated successfully" })
}

module.exports = {
    getAllUsers,
    getSingleUser,
    showCurrentUser,
    updateUser,
    updateUserPassword
}