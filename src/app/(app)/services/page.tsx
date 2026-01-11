"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ServiceFormModal } from "@/components/forms/service-form-modal";
import { useConfirm } from "@/hooks/use-confirm";
import { motion, AnimatePresence } from "framer-motion";

interface Service {
    id: string;
    code: string;
    description: string;
    image: string | null;
    price: number | null;
    createdAt: string;
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const { confirm, ConfirmDialog } = useConfirm();

    const fetchServices = async () => {
        try {
            const response = await fetch("/api/services");
            if (!response.ok) throw new Error("Failed to fetch services");
            const data = await response.json();
            setServices(data);
        } catch (error) {
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleCreate = async (data: any) => {
        try {
            const response = await fetch("/api/services", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to create service");

            toast.success("Service created successfully");
            fetchServices();
        } catch (error) {
            throw error;
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingService) return;
        try {
            const response = await fetch(`/api/services/${editingService.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to update service");

            toast.success("Service updated successfully");
            setEditingService(null);
            fetchServices();
        } catch (error) {
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm("Are you sure you want to delete this service?");
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/services/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete service");

            toast.success("Service deleted successfully");
            fetchServices();
        } catch (error) {
            toast.error("Failed to delete service");
        }
    };

    const handleGenerateDefaults = async () => {
        setLoading(true);
        try {
            // Seed default services (Expanded to 20 items)
            const defaults = [
                // Video Production & Content
                { code: "VID-PROD-FULL", description: "Full-Service Video Production (Script to Screen)", image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&q=80&w=1000" },
                { code: "VID-EDIT-PRO", description: "Professional Video Editing & Color Grading", image: "https://images.unsplash.com/photo-1574717024453-354056aef981?auto=format&fit=crop&q=80&w=1000" },
                { code: "VID-ANIM-2D", description: "2D Animation & Motion Graphics", image: null },
                { code: "VID-ANIM-3D", description: "3D Modeling & Animation", image: null },
                { code: "VID-LIVE-STR", description: "Live Streaming & Webinar Production", image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&q=80&w=1000" },
                { code: "VID-DRONE", description: "Aerial Drone Videography & Photography", image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&q=80&w=1000" },
                { code: "VID-UGC-CRE", description: "User-Generated Content (UGC) Creation", image: null },

                // Influencer Management
                { code: "INF-STRAT-G", description: "Influencer Marketing Strategy & Planning", image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000" },
                { code: "INF-DISC-VET", description: "Influencer Discovery & Vetting", image: null },
                { code: "INF-REL-MNGT", description: "Influencer Relationship Management", image: null },
                { code: "INF-CONTRACT", description: "Contract Negotiation & Legal Compliance", image: null },
                { code: "INF-EVENT-PR", description: "Influencer Events & PR Activations", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1000" },
                { code: "INF-GIFT-SAMP", description: "Product Seeding & Gifting Campaigns", image: null },

                // Strategy & Branding
                { code: "BRD-IDENT", description: "Brand Identity Design & Guidelines", image: null },
                { code: "STRAT-SOC-MED", description: "Social Media Organic Strategy", image: null },
                { code: "STRAT-PAID-AD", description: "Paid Social Media Advertising (Meta/TikTok)", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1000" },
                { code: "CON-COPY", description: "Copywriting & Scriptwriting Services", image: null },

                // Analytics & Reporting
                { code: "ANL-PERF-RPT", description: "Campaign Performance Reporting & Analysis", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000" },
                { code: "ANL-AUD-INS", description: "Audience Insights & Demographics Study", image: null },
                { code: "TECH-INT-CRM", description: "CRM Integration & Automation Setup", image: null }
            ];

            for (const service of defaults) {
                await fetch("/api/services", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(service),
                });
            }

            toast.success("Default services generated");
            fetchServices();
        } catch (error) {
            toast.error("Failed to generate defaults");
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(service =>
        service.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-light tracking-tight text-foreground">Services</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your service offerings and codes.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleGenerateDefaults} disabled={loading}>
                        {services.length === 0 ? "Generate Defaults" : "Add Missing Defaults"}
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingService(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-[#142030] hover:bg-[#142030]/90 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                    </Button>
                </div>
            </div>

            <Card className="border-border/40 shadow-sm">
                <CardHeader className="p-4 pb-2 border-b border-border/40">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search services..."
                            className="pl-9 max-w-sm bg-muted/30 border-border/40"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="w-[150px]">Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            Loading services...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredServices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 py-6">
                                                <p className="text-muted-foreground">No services found.</p>
                                                {searchQuery === "" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleGenerateDefaults}
                                                        disabled={loading}
                                                        className="mt-2"
                                                    >
                                                        <Briefcase className="h-4 w-4 mr-2" />
                                                        Generate Default Services
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredServices.map((service) => (
                                        <motion.tr
                                            key={service.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group border-b border-dotted border-border/40 hover:bg-muted/30 transition-colors"
                                            layout
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded bg-[#142030]/10 flex items-center justify-center text-[#142030]">
                                                        <Briefcase className="h-4 w-4" />
                                                    </div>
                                                    {service.code}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-md truncate text-muted-foreground">
                                                {service.description}
                                            </TableCell>
                                            <TableCell>
                                                {service.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(service.price) : "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() => {
                                                            setEditingService(service);
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(service.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ServiceFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSubmit={editingService ? handleUpdate : handleCreate}
                initialData={editingService ? {
                    ...editingService,
                    image: editingService.image || undefined,
                    price: editingService.price || undefined
                } : undefined}
            />

            <ConfirmDialog />
        </div>
    );
}
