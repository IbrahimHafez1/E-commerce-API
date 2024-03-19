const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide review title'],
        trim: true,
        maxlength: 100
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please provide rating']
    },
    comment: {
        type: String,
        required: [true, 'Please provide review comment']
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    }
}, { timestamps: true }
)

reviewSchema.index({ product: 1, user: 1 }, { unique: true })

reviewSchema.statics.getAverageRating = async function (productId) {
    const result = await this.aggregate([
        {
            $match: { product: productId }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 }
            }
        }
    ])
    try {
        await this.model('Product').findByIdAndUpdate(productId, {
            averageRating: Math.ceil(result[0].averageRating || 0)
        })
    } catch (error) {
        console.log(error)
    }
}

reviewSchema.post('save', async function () {
    await this.constructor.getAverageRating(this.product)
})
reviewSchema.post('remove', async function () {
    await this.constructor.getAverageRating(this.product)
})

module.exports = mongoose.model('Review', reviewSchema)