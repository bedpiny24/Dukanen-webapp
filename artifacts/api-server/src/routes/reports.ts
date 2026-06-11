import { Router } from "express";
import { db, reportsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";
import { CreateReportBody } from "@workspace/api-zod";

const router = Router();

router.post("/reports", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.insert(reportsTable).values({
    ...parsed.data,
    reporterId: req.user!.userId,
    status: "pending",
  });
  res.status(201).json({ message: "Report submitted successfully" });
});

export default router;
