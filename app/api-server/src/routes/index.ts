import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentsRouter from "./payments";
import verifyRouter from "./verify";
import paymentsPrivateRouter from "./payments-private";
import portfolioPrivateRouter from "./portfolio-private";
import solanaRouter from "./solana";

const router: IRouter = Router();

router.use(healthRouter);
// Private Umbra routes should take precedence for payments
router.use('/payments', paymentsPrivateRouter);
router.use(paymentsRouter);
router.use('/portfolio', portfolioPrivateRouter);
router.use(verifyRouter);
router.use(solanaRouter);

export default router;
