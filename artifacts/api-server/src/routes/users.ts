import { Router } from "express";
import { db, usersTable, productsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { UpdateUserBody, UpdateUserParams, GetUserParams, GetUserProductsParams } from "@workspace/api-zod";
import { enrichProducts } from "./products.js";

const router = Router();

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [{ total }] = await db.select({ total: count() }).from(productsTable).where(
    and(eq(productsTable.sellerId, user.id), eq(productsTable.status, "active"))
  );
  const { passwordHash: _, ...publicUser } = user;
  res.json({ ...publicUser, productCount: Number(total) });
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (req.user!.userId !== params.data.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...sanitized } = updated;
  res.json(sanitized);
});

router.get("/users/:id/products", async (req, res): Promise<void> => {
  const params = GetUserProductsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db.select().from(productsTable).where(
    and(eq(productsTable.sellerId, params.data.id), eq(productsTable.status, "active"))
  );
  const products = await enrichProducts(rows);
  res.json(products);
});

export default router;
