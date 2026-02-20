import { Router } from "express";
import authRoute from "./aurh.route.js"
import userRoute from "./user.route.js"
import sellerRoute from "./seller.route.js"
import shopRoute from "./shop.route.js"
import categoryRoute from './category.route.js'
import productRoute from './product.route.js'
import reviewRoute from './review.route.js'
import shopReviewRoute from './shop-review.route.js'
import orderRoute from './order.route.js'
import orderItemRoute from './order-item.route.js'

const mainRoute = Router()

mainRoute
    .use('/auth', authRoute)
    .use('/users', userRoute)
    .use('/sellers', sellerRoute)
    .use('/shop', shopRoute)
    .use('/category', categoryRoute)
    .use('/products', productRoute)
    .use('/reviews', reviewRoute)
    .use('/shop-reviews', shopReviewRoute)
    .use('/orders', orderRoute)
    .use('/order-items', orderItemRoute)


export default mainRoute
