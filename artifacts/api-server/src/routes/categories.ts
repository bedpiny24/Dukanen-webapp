import { Router } from "express";
import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

const router = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);

  // get product counts per category
  const counts = await db
    .select({ categoryId: productsTable.categoryId, cnt: count() })
    .from(productsTable)
    .where(eq(productsTable.status, "active"))
    .groupBy(productsTable.categoryId);

  const countMap = new Map(counts.map((c) => [c.categoryId, Number(c.cnt)]));

  const result = cats.map((c) => ({
    ...c,
    productCount: countMap.get(c.id) ?? 0,
  }));

  res.json(result);
});

export default router;
