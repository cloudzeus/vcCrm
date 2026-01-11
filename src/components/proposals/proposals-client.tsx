"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { FileText, Download, Search, Building2, TrendingUp, Plus, Eye, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { ProposalModal } from "@/components/forms/proposal-modal";
import { toast } from "sonner";

export interface Proposal {
    id: string;
    title: string | null;
    totalAmount: number;
    status: string;
    companyName: string;
    companyId: string;
    crmRecordTitle: string | null;
    crmRecordId: string | null;
    createdAt: string;
}

interface ProposalsClientProps {
    initialProposals: Proposal[];
}

export function ProposalsClient({ initialProposals }: ProposalsClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const router = useRouter();

    const filteredProposals = initialProposals.filter((p) =>
        (p.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        p.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns: ColumnDef<Proposal>[] = [
        {
            id: "title",
            header: "Title",
            accessorKey: "title",
            cell: ({ row }) => (
                <span className="font-medium text-xs">{row.original.title || "Untitled Proposal"}</span>
            ),
        },
        {
            id: "company",
            header: "Company",
            accessorKey: "companyName",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => router.push(`/companies/${row.original.companyId}`)}>
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{row.original.companyName}</span>
                </div>
            ),
        },
        {
            id: "relatedTo",
            header: "Related To",
            accessorKey: "crmRecordTitle",
            cell: ({ row }) => row.original.crmRecordId ? (
                <div className="flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => router.push(`/leads/${row.original.crmRecordId}`)}>
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{row.original.crmRecordTitle}</span>
                </div>
            ) : <span className="text-xs text-muted-foreground">-</span>,
        },
        {
            id: "amount",
            header: "Amount",
            accessorKey: "totalAmount",
            cell: ({ row }) => (
                <span className="text-xs font-medium">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.original.totalAmount)}
                </span>
            ),
        },
        {
            id: "status",
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-[10px]">
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: "date",
            header: "Date",
            accessorKey: "createdAt",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {format(new Date(row.original.createdAt), "MMM d, yyyy")}
                </span>
            )
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => router.push(`/proposals/${row.original.id}`)}
                        title="View Details"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                            setSelectedProposal(row.original);
                            setIsEditModalOpen(true);
                        }}
                        title="Edit"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(`/api/proposals/${row.original.id}/export`, "_blank")}
                        title="Download"
                    >
                        <Download className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="font-light tracking-tight text-sm">PROPOSALS</h1>
                    <p className="text-xs text-muted-foreground font-light">
                        All proposals across your organization
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="text-xs h-8">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Proposal
                </Button>
            </div>

            <ProposalModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={() => {
                    router.refresh();
                    toast.success("Proposal created");
                }}
            />

            <ProposalModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                proposalId={selectedProposal?.id}
                companyId={selectedProposal?.companyId}
                onSuccess={() => {
                    router.refresh();
                    toast.success("Proposal updated");
                    setSelectedProposal(null);
                }}
            />

            <Card className="border-dotted border-gray-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-light">All Proposals</CardTitle>
                            <CardDescription className="text-[10px]">
                                {filteredProposals.length} proposal{filteredProposals.length !== 1 ? "s" : ""}
                            </CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search proposals..."
                                className="pl-10 h-9 w-[250px] text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-3">
                    <DataTable
                        data={filteredProposals}
                        columns={columns}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
