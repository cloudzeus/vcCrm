"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowLeft, Building2, Calendar, Download, FileText, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProposalDetailClientProps {
    proposal: any; // Using any to avoid type gymnastics with stale client
}

export function ProposalDetailClient({ proposal }: ProposalDetailClientProps) {
    const router = useRouter();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">{proposal.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{format(new Date(proposal.createdAt), "MMMM d, yyyy")}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm px-3 py-1">
                        {proposal.status}
                    </Badge>
                    <Button variant="outline" onClick={() => window.open(`/api/proposals/${proposal.id}/export`, "_blank")}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF/Word
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Services & Pricing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                                        <tr className="border-b">
                                            <th className="p-3">Service</th>
                                            <th className="p-3 text-right">Qty</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {proposal.items?.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="p-3">
                                                    <div className="font-medium">{item.service?.code || "Service"}</div>
                                                    <div className="text-xs text-muted-foreground">{item.service?.description}</div>
                                                </td>
                                                <td className="p-3 text-right">{item.quantity}</td>
                                                <td className="p-3 text-right">${item.price?.toFixed(2)}</td>
                                                <td className="p-3 text-right font-medium">${item.total?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/50 font-medium">
                                        <tr>
                                            <td colSpan={3} className="p-3 text-right">Total Amount</td>
                                            <td className="p-3 text-right">${proposal.totalAmount?.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description/Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Proposal Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {proposal.shortDescription && (
                                <div>
                                    <h3 className="text-sm font-medium mb-1 text-muted-foreground">Short Description</h3>
                                    <p className="text-sm">{proposal.shortDescription}</p>
                                </div>
                            )}

                            {proposal.content && (
                                <div>
                                    <h3 className="text-sm font-medium mb-1 text-muted-foreground">Detail (AI Generated)</h3>
                                    <div className="text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-md border">
                                        {proposal.content}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Meta Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground mb-1">Company</h3>
                                <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer" onClick={() => router.push(`/companies/${proposal.companyId}`)}>
                                    <Building2 className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-primary hover:underline">{proposal.company?.name || "Unknown Company"}</span>
                                </div>
                            </div>

                            {proposal.crmRecord && (
                                <div>
                                    <h3 className="text-xs font-medium text-muted-foreground mb-1">Related Lead</h3>
                                    <div className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer" onClick={() => router.push(`/leads/${proposal.crmRecordId}`)}>
                                        <TrendingUp className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium text-primary hover:underline">{proposal.crmRecord.title}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
