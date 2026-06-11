import { useListAdminUsers, useAdminUpdateUser, getListAdminUsersQueryKey, AdminUserUpdateRole } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { Shield, ShieldAlert, ArrowLeft, Search, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data: usersData, isLoading } = useListAdminUsers({ search: search || undefined });
  const updateUser = useAdminUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = (id: number, data: { isBanned?: boolean, role?: AdminUserUpdateRole }) => {
    updateUser.mutate({ id, data }, {
      onSuccess: () => {
        toast({ title: "User updated" });
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
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
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 max-w-sm mb-6">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : usersData?.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{user.email}</div>
                  <div className="text-xs text-muted-foreground">{user.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  {user.isBanned ? (
                    <Badge variant="destructive">Banned</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAction(user.id, { role: "admin" })}>
                        <Shield className="w-4 h-4 mr-2" /> Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(user.id, { role: "seller" })}>
                        Make Seller
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction(user.id, { role: "buyer" })}>
                        Make Buyer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.isBanned ? (
                        <DropdownMenuItem onClick={() => handleAction(user.id, { isBanned: false })} className="text-green-600 focus:text-green-600">
                          <Shield className="w-4 h-4 mr-2" /> Unban User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleAction(user.id, { isBanned: true })} className="text-destructive focus:text-destructive">
                          <ShieldAlert className="w-4 h-4 mr-2" /> Ban User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
