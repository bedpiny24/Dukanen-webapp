import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useListCategories, 
  useCreateProduct, 
  useUpdateProduct, 
  useGetProduct,
  getGetProductQueryKey,
  ProductInputCondition,
  ProductUpdateStatus
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Plus } from "lucide-react";

export default function SellerProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const productId = id ? parseInt(id, 10) : undefined;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories();
  const { data: existingProduct, isLoading: isLoadingProduct } = useGetProduct(productId || 0, {
    query: { enabled: isEditing, queryKey: getGetProductQueryKey(productId || 0) }
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [condition, setCondition] = useState<ProductInputCondition>("used");
  const [locationStr, setLocationStr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<ProductUpdateStatus>("active");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  useEffect(() => {
    if (isEditing && existingProduct) {
      setTitle(existingProduct.title);
      setDescription(existingProduct.description);
      setPrice(existingProduct.price.toString());
      setCurrency(existingProduct.currency);
      setCondition(existingProduct.condition as ProductInputCondition);
      setLocationStr(existingProduct.location || "");
      setCategoryId(existingProduct.categoryId.toString());
      setStatus(existingProduct.status as ProductUpdateStatus);
      
      if (existingProduct.imageUrls && existingProduct.imageUrls.length > 0) {
        setImageUrls(existingProduct.imageUrls);
      }
    }
  }, [isEditing, existingProduct]);

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const removeImageUrl = (index: number) => {
    const newUrls = [...imageUrls];
    newUrls.splice(index, 1);
    if (newUrls.length === 0) newUrls.push("");
    setImageUrls(newUrls);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty URLs
    const validImageUrls = imageUrls.filter(url => url.trim() !== "");

    if (isEditing && productId) {
      updateProduct.mutate({
        id: productId,
        data: {
          title,
          description,
          price: Number(price),
          currency,
          condition,
          location: locationStr,
          categoryId: parseInt(categoryId, 10),
          status,
          imageUrls: validImageUrls.length > 0 ? validImageUrls : undefined
        }
      }, {
        onSuccess: () => {
          toast({ title: "Product updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
          setLocation("/seller/products");
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
      });
    } else {
      createProduct.mutate({
        data: {
          title,
          description,
          price: Number(price),
          currency,
          condition,
          location: locationStr,
          categoryId: parseInt(categoryId, 10),
          imageUrls: validImageUrls.length > 0 ? validImageUrls : undefined
        }
      }, {
        onSuccess: () => {
          toast({ title: "Product created successfully" });
          setLocation("/seller/products");
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
      });
    }
  };

  if (isEditing && isLoadingProduct) {
    return <div className="p-8 text-center">Loading product data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => setLocation("/seller/products")} className="mb-6 gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{isEditing ? 'Edit Listing' : 'Create New Listing'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Samsung Galaxy S21" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                className="min-h-[120px]"
                placeholder="Describe your product in detail..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="flex gap-2">
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="UGX">UGX</SelectItem>
                      <SelectItem value="TZS">TZS</SelectItem>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="flex-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={condition} onValueChange={(v) => setCondition(v as ProductInputCondition)} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={locationStr} onChange={(e) => setLocationStr(e.target.value)} placeholder="e.g. Nairobi, CBD" />
              </div>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProductUpdateStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Visible)</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="removed">Removed (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Label>Image URLs</Label>
              {imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    value={url} 
                    onChange={(e) => handleImageUrlChange(index, e.target.value)} 
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => removeImageUrl(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addImageUrl} className="gap-2">
                <Plus className="w-4 h-4" /> Add Another Image
              </Button>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t">
              <Button type="button" variant="outline" onClick={() => setLocation("/seller/products")}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {createProduct.isPending || updateProduct.isPending ? "Saving..." : (isEditing ? "Update Listing" : "Publish Listing")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
