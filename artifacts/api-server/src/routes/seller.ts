import { Router } from "express";
import { db, productsTable, messagesTable, conversationsTable } from "@workspace/db";
import { eq, and, count, sum, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { enrichProducts } from "./products.js";

const router = Router();

router.get("/seller/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const products = await db.select().from(productsTable).where(eq(productsTable.sellerId, userId));
  const totalListings = products.length;
  const activeListings = products.filter((p) => p.status === "active").length;
  const soldListings = products.filter((p) => p.status === "sold").length;
  const totalViews = products.reduce((acc, p) => acc + p.viewCount, 0);

  const conversations = await db.select().from(conversationsTable).where(eq(conversationsTable.sellerId, userId));
  const convIds = conversations.map((c) => c.id);

  let unreadMessages = 0;
  if (convIds.length > 0) {
    const unread = await db
      .select({ cnt: count() })
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.isRead, false)
        )
      );
    unreadMessages = Number(unread[0]?.cnt ?? 0);
  }

  const recentProducts = products
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((p) => ({
      type: "listing",
      description: `Listed "${p.title}" for ${p.currency} ${p.price}`,
      createdAt: p.createdAt.toISOString(),
    }));

  res.json({
    totalListings,
    activeListings,
    soldListings,
    totalViews,
    unreadMessages,
    recentActivity: recentProducts,
  });
});

router.get("/seller/products", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const rows = await db.select().from(productsTable).where(eq(productsTable.sellerId, userId)).orderBy(desc(productsTable.createdAt));
  const products = await enrichProducts(rows);
  res.json(products);
});

export default router;
