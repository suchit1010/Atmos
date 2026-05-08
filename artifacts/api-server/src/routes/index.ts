import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentsRouter from "./payments";
import verifyRouter from "./verify";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paymentsRouter);
router.use(verifyRouter);

export default router;
