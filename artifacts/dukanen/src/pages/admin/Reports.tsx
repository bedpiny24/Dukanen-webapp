import { useListAdminReports, useAdminUpdateReport, getListAdminReportsQueryKey, AdminReportUpdateStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminReports() {
  const { data: reportsData, isLoading } = useListAdminReports();
  const updateReport = useAdminUpdateReport();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = (id: number, status: AdminReportUpdateStatus) => {
    updateReport.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: "Report updated" });
        queryClient.invalidateQueries({ queryKey: getListAdminReportsQueryKey() });
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
          <h1 className="text-2xl font-bold text-foreground">Review Reports</h1>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : reportsData?.reports.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No reports found.</TableCell></TableRow>
            ) : reportsData?.reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <Badge variant="outline" className="mb-1">{report.targetType}</Badge>
                  <div className="text-xs text-muted-foreground mt-1">ID: {report.targetId}</div>
                  {report.targetType === 'product' && (
                     <Link href={`/products/${report.targetId}`} className="text-xs text-primary hover:underline block mt-1">View Listing</Link>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm max-w-sm">{report.reason}</p>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(report.createdAt).toLocaleString()}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                    {report.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {report.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAction(report.id, "dismissed")} className="h-8">
                        <XCircle className="w-4 h-4 mr-1 text-muted-foreground" /> Dismiss
                      </Button>
                      <Button size="sm" variant="default" onClick={() => handleAction(report.id, "resolved")} className="h-8">
                        <CheckCircle className="w-4 h-4 mr-1" /> Resolve
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
