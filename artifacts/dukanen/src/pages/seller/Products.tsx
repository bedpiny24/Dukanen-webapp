import { useListSellerProducts, useDeleteProduct, useUpdateProduct, getListSellerProductsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Edit, Trash2, Tag, Eye, MoreHorizontal, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function SellerProducts() {
  const { data: productData, isLoading } = useListSellerProducts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const handleMarkAsSold = (id: number) => {
    updateProduct.mutate({
      id,
      data: { status: "sold" }
    }, {
      onSuccess: () => {
        toast({ title: "Product updated", description: "Marked as sold." });
        queryClient.invalidateQueries({ queryKey: getListSellerProductsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to update", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleMarkAsActive = (id: number) => {
    updateProduct.mutate({
      id,
      data: { status: "active" }
    }, {
      onSuccess: () => {
        toast({ title: "Product updated", description: "Marked as active." });
        queryClient.invalidateQueries({ queryKey: getListSellerProductsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to update", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    if (!productToDelete) return;
    deleteProduct.mutate({ id: productToDelete }, {
      onSuccess: () => {
        toast({ title: "Product deleted" });
        queryClient.invalidateQueries({ queryKey: getListSellerProductsQueryKey() });
        setProductToDelete(null);
      },
      onError: (err) => {
        toast({ title: "Delete failed", description: err.message, variant: "destructive" });
        setProductToDelete(null);
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory and availability.</p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href="/seller/products/new">
            <Plus className="w-5 h-5" /> New Listing
          </Link>
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48 mb-2" /><Skeleton className="h-3 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : productData?.products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  You haven't listed any products yet.
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <Link href="/seller/products/new">Create your first listing</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              productData?.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {product.imageUrls?.[0] ? (
                        <img src={product.imageUrls[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Tag className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{product.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{product.categoryName}</div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {product.currency} {product.price}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      product.status === 'active' ? 'default' : 
                      product.status === 'sold' ? 'secondary' : 'outline'
                    }>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <div className="flex items-center justify-end gap-1">
                      <Eye className="w-3 h-3" /> {product.viewCount || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.id}`} className="cursor-pointer">
                            <Eye className="w-4 h-4 mr-2" /> View Listing
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/seller/products/${product.id}/edit`} className="cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" /> Edit Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {product.status !== 'sold' ? (
                          <DropdownMenuItem onClick={() => handleMarkAsSold(product.id)}>
                            <CheckCircle className="w-4 h-4 mr-2 text-secondary" /> Mark as Sold
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleMarkAsActive(product.id)}>
                            <Tag className="w-4 h-4 mr-2 text-primary" /> Relist Item
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setProductToDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(o) => !o && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your product listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteProduct.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
