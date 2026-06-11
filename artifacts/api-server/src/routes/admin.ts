import { Router } from "express";
import { db, usersTable, productsTable, reportsTable } from "@workspace/db";
import { eq, ilike, and, count, desc, gte, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth.js";
import {
  ListAdminUsersQueryParams,
  AdminUpdateUserParams,
  AdminUpdateUserBody,
  ListAdminProductsQueryParams,
  AdminUpdateProductParams,
  AdminUpdateProductBody,
  ListAdminReportsQueryParams,
  AdminUpdateReportParams,
  AdminUpdateReportBody,
} from "@workspace/api-zod";
import { enrichProducts } from "./products.js";

const router = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [{ total: totalUsers }] = await db.select({ total: count() }).from(usersTable);
  const [{ total: totalSellers }] = await db.select({ total: count() }).from(usersTable).where(eq(usersTable.role, "seller"));
  const [{ total: totalProducts }] = await db.select({ total: count() }).from(productsTable);
  const [{ total: activeProducts }] = await db.select({ total: count() }).from(productsTable).where(eq(productsTable.status, "active"));
  const [{ total: totalReports }] = await db.select({ total: count() }).from(reportsTable);
  const [{ total: pendingReports }] = await db.select({ total: count() }).from(reportsTable).where(eq(reportsTable.status, "pending"));

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [{ total: newUsersThisWeek }] = await db.select({ total: count() }).from(usersTable).where(gte(usersTable.createdAt, weekAgo));
  const [{ total: newProductsThisWeek }] = await db.select({ total: count() }).from(productsTable).where(gte(productsTable.createdAt, weekAgo));

  res.json({
    totalUsers: Number(totalUsers),
    totalSellers: Number(totalSellers),
    totalProducts: Number(totalProducts),
    activeProducts: Number(activeProducts),
    totalReports: Number(totalReports),
    pendingReports: Number(pendingReports),
    newUsersThisWeek: Number(newUsersThisWeek),
    newProductsThisWeek: Number(newProductsThisWeek),
  });
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ListAdminUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1, limit = 20, search } = parsed.data;
  const conditions = search ? [ilike(usersTable.name, `%${search}%`)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(usersTable).where(where);
  const offset = (page - 1) * limit;
  const users = await db.select().from(usersTable).where(where).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
  const sanitized = users.map(({ passwordHash: _, ...u }) => u);
  res.json({ users: sanitized, total: Number(total), page, limit });
});

router.patch("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdateUserBody.safeParse(req.body);
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

router.get("/admin/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ListAdminProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1, limit = 20, status } = parsed.data;
  const conditions = status ? [eq(productsTable.status, status)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(productsTable).where(where);
  const offset = (page - 1) * limit;
  const rows = await db.select().from(productsTable).where(where).orderBy(desc(productsTable.createdAt)).limit(limit).offset(offset);
  const products = await enrichProducts(rows);
  res.json({ products, total: Number(total), page, limit });
});

router.patch("/admin/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(productsTable).set(parsed.data).where(eq(productsTable.id, params.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [enriched] = await enrichProducts([updated]);
  res.json(enriched);
});

router.get("/admin/reports", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ListAdminReportsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1, limit = 20, status } = parsed.data;
  const conditions = status ? [eq(reportsTable.status, status)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(reportsTable).where(where);
  const offset = (page - 1) * limit;
  const reports = await db.select().from(reportsTable).where(where).orderBy(desc(reportsTable.createdAt)).limit(limit).offset(offset);
  res.json({ reports, total: Number(total), page, limit });
});

router.patch("/admin/reports/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db.update(reportsTable).set(parsed.data).where(eq(reportsTable.id, params.data.id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(updated);
});

export default router;
