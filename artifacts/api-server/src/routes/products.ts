import { Router } from "express";
import { db, productsTable, usersTable, categoriesTable } from "@workspace/db";
import { eq, and, ilike, gte, lte, desc, count, sql, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";
import {
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/products", optionalAuth, async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, category, location, minPrice, maxPrice, page = 1, limit = 20 } = parsed.data;

  const conditions = [eq(productsTable.status, "active")];
  if (search) conditions.push(ilike(productsTable.title, `%${search}%`));
  if (location) conditions.push(ilike(productsTable.location!, `%${location}%`));
  if (minPrice !== undefined) conditions.push(gte(productsTable.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(productsTable.price, maxPrice));

  const where = and(...conditions);

  let categoryId: number | undefined;
  if (category) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, category));
    if (cat) categoryId = cat.id;
  }
  if (categoryId) {
    conditions.push(eq(productsTable.categoryId, categoryId));
  }

  const finalWhere = and(...conditions);

  const [{ total }] = await db.select({ total: count() }).from(productsTable).where(finalWhere);
  const offset = (page - 1) * limit;

  const rows = await db.select().from(productsTable).where(finalWhere).orderBy(desc(productsTable.createdAt)).limit(limit).offset(offset);
  const products = await enrichProducts(rows);

  res.json({ products, total: Number(total), page, limit });
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.status, "active"))
    .orderBy(desc(productsTable.viewCount), desc(productsTable.createdAt))
    .limit(12);
  const products = await enrichProducts(rows);
  res.json(products);
});

router.get("/products/:id", optionalAuth, async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // increment view count
  await db.update(productsTable).set({ viewCount: product.viewCount + 1 }).where(eq(productsTable.id, product.id));

  const [enriched] = await enrichProducts([{ ...product, viewCount: product.viewCount + 1 }]);
  res.json(enriched);
});

router.post("/products", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    sellerId: req.user!.userId,
    status: "active",
    viewCount: 0,
    imageUrls: parsed.data.imageUrls ?? [],
    location: parsed.data.location ?? null,
  }).returning();

  const [enriched] = await enrichProducts([product]);
  res.status(201).json(enriched);
});

router.patch("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  if (existing.sellerId !== req.user!.userId && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [updated] = await db.update(productsTable).set(parsed.data).where(eq(productsTable.id, params.data.id)).returning();
  const [enriched] = await enrichProducts([updated]);
  res.json(enriched);
});

router.delete("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  if (existing.sellerId !== req.user!.userId && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.json({ message: "Product deleted" });
});

async function enrichProducts(rows: (typeof productsTable.$inferSelect)[]) {
  if (rows.length === 0) return [];
  const sellerIds = [...new Set(rows.map((r) => r.sellerId))];
  const categoryIds = [...new Set(rows.map((r) => r.categoryId))];

  const sellers = await db.select().from(usersTable).where(inArray(usersTable.id, sellerIds));
  const categories = await db.select().from(categoriesTable).where(inArray(categoriesTable.id, categoryIds));

  const sellerMap = new Map(sellers.map((s) => [s.id, s]));
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return rows.map((p) => {
    const seller = sellerMap.get(p.sellerId);
    const cat = catMap.get(p.categoryId);
    return {
      ...p,
      categoryName: cat?.name ?? null,
      sellerName: seller?.name ?? null,
      sellerPhone: seller?.phone ?? null,
    };
  });
}

export { enrichProducts };
export default router;
