import { Router } from "express";
import authRoute from "./aurh.route.js"
import userRoute from "./user.route.js"
import sellerRoute from "./seller.route.js"
import shopRoute from "./shop.route.js"

const mainRoute = Router()

mainRoute.use('/auth', authRoute)
mainRoute.use('/users', userRoute)
mainRoute.use('/sellers', sellerRoute)
mainRoute.use('/shop', shopRoute)


export default mainRoute
