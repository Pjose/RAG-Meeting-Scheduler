import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meetingsRouter from "./meetings";
import peopleRouter from "./people";
import scheduleRouter from "./schedule";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meetingsRouter);
router.use(peopleRouter);
router.use(scheduleRouter);

export default router;
