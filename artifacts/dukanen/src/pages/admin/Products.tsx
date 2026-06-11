import { useListAdminProducts, useAdminUpdateProduct, getListAdminProductsQueryKey, AdminProductUpdateStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, Check, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminProducts() {
  const { data: productsData, isLoading } = useListAdminProducts();
  const updateProduct = useAdminUpdateProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = (id: number, status: AdminProductUpdateStatus) => {
    updateProduct.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Product updated" });
        queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
      },
      onError: (err) => toast({ title: "Failed", description: err.message, variant: "destructive" })
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : productsData?.products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="font-medium"><Link href={`/products/${product.id}`} className="hover:underline">{product.title}</Link></div>
                  <div className="text-xs text-muted-foreground">{product.currency} {product.price} • {product.categoryName}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{product.sellerName}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.status === 'active' ? 'default' : product.status === 'removed' ? 'destructive' : 'outline'}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {product.status !== 'removed' && (
                      <Button size="sm" variant="destructive" onClick={() => handleAction(product.id, "removed")} className="h-8">
                        <ShieldAlert className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    )}
                    {product.status === 'removed' && (
                      <Button size="sm" variant="outline" onClick={() => handleAction(product.id, "active")} className="h-8">
                        <Check className="w-4 h-4 mr-1" /> Restore
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
