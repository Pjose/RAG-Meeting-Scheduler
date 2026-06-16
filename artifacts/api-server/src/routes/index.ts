import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meetingsRouter from "./meetings";
import peopleRouter from "./people";
import scheduleRouter from "./schedule";
import hiMeetingsRouter from "./hi-meetings";
import hiScheduleRouter from "./hi-schedule";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meetingsRouter);
router.use(peopleRouter);
router.use(scheduleRouter);
router.use(hiMeetingsRouter);
router.use(hiScheduleRouter);

export default router;
