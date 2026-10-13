import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import batchesRouter from "./batches";
import proofRouter from "./proof";
import chainRouter from "./chain";
import demoRouter from "./demo";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(batchesRouter);
router.use(proofRouter);
router.use(chainRouter);
router.use(demoRouter);

export default router;
