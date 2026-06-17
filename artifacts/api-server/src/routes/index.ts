import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import meetingsRouter from "./meetings";
import peopleRouter from "./people";
import scheduleRouter from "./schedule";
import hiMeetingsRouter from "./hi-meetings";
import hiScheduleRouter from "./hi-schedule";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use((req, res, next): void => {
  if (req.method === "GET") { next(); return; }
  if (req.path.startsWith("/auth")) { next(); return; }
  if (req.session?.authenticated !== true) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

router.use(meetingsRouter);
router.use(peopleRouter);
router.use(scheduleRouter);
router.use(hiMeetingsRouter);
router.use(hiScheduleRouter);

export default router;
