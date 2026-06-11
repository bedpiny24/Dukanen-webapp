import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import usersRouter from "./users";
import sellerRouter from "./seller";
import messagesRouter from "./messages";
import reportsRouter from "./reports";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(usersRouter);
router.use(sellerRouter);
router.use(messagesRouter);
router.use(reportsRouter);
router.use(adminRouter);

export default router;
