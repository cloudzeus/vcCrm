"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface LicenseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // We can pass process.env values here if we want to keep it purely client side component without server logic inside
    licenseInfo?: {
        serialNumber?: string;
        ownerName?: string;
        ownerVat?: string;
        vendorName?: string;
        vendorVat?: string;
        date?: string;
    };
}

export function LicenseModal({
    open,
    onOpenChange,
    licenseInfo = {
        // Fallback if not provided via props (e.g. if we want to fetch from an API or pass from parent)
        // In a real app we might want to fetch this securely or pass it from a server component
        // For now we'll use empty strings as defaults if not passed. 
        // Note: process.env is not directly available in client components unless prefixed with NEXT_PUBLIC_
        // However, for this task, I will assume the parent passes it or we mocked it.
        // But wait, the previous implementation used process.env directly in a page (which is server component by default).
        // Here we are in a client component. We should probably fetch this info via a server action or API route.
        // To keep it simple and secure, we'll assume the parent (Sidebar) might eventually fetch it, 
        // BUT Sidebar is also a client component.
        // Let's create a server action to get license info safely.
        serialNumber: "",
        ownerName: "",
        ownerVat: "",
        vendorName: "",
        vendorVat: "",
        date: "",
    }
}: LicenseModalProps) {

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b pb-4">
                    <DialogTitle className="text-xl font-light tracking-tight flex items-center justify-between">
                        <span>Software License</span>
                        <Badge variant="outline" className="font-mono text-xs font-normal">
                            {licenseInfo.serialNumber || "Unlicensed"}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] p-6">
                    <div className="space-y-8 text-sm text-foreground/80 font-light">
                        {/* License Header Info */}
                        <div className="grid grid-cols-2 gap-8 p-4 bg-muted/30 rounded-lg border">
                            <div>
                                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Licensed To</h4>
                                <p className="font-medium text-base">{licenseInfo.ownerName}</p>
                                <p className="font-mono text-xs opacity-70">VAT: {licenseInfo.ownerVat}</p>
                            </div>
                            <div>
                                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Vendor</h4>
                                <p className="font-medium text-base">{licenseInfo.vendorName}</p>
                                <p className="font-mono text-xs opacity-70">VAT: {licenseInfo.vendorVat}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t mt-2">
                                <p className="text-xs text-muted-foreground flex justify-between">
                                    <span>License Validity Date</span>
                                    <span className="font-medium text-foreground">{licenseInfo.date}</span>
                                </p>
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-foreground">End User License Agreement (EULA)</h3>
                            <p>
                                This End User License Agreement ("Agreement") is a legal agreement between you ("Licensee") and {licenseInfo.vendorName} ("Licensor") for the software product accompanying this Agreement.
                            </p>

                            <h4 className="font-medium text-foreground mt-4">1. Grant of License</h4>
                            <p>
                                Subject to the terms of this Agreement, Licensor grants to Licensee a non-exclusive, non-transferable license to use the Software for internal business purposes only.
                            </p>

                            <h4 className="font-medium text-foreground mt-4">2. Restrictions</h4>
                            <p>
                                You may not reverse engineer, decompile, or disassemble the Software. You may not rent, lease, or lend the Software.
                            </p>

                            <h4 className="font-medium text-foreground mt-4">3. Termination</h4>
                            <p>
                                This license is effective until terminated. Your rights under this license will terminate automatically without notice from Licensor if you fail to comply with any term of this Agreement.
                            </p>
                        </div>

                        <Separator />

                        {/* GDPR & Privacy */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-foreground">Privacy Policy & GDPR Compliance</h3>
                            <p>
                                We are committed to protecting your personal data in accordance with the General Data Protection Regulation (GDPR).
                            </p>

                            <h4 className="font-medium text-foreground mt-4">Data Collection</h4>
                            <p>
                                We collect only the data necessary for the functionality of the software and to provide support services.
                            </p>

                            <h4 className="font-medium text-foreground mt-4">Data Rights</h4>
                            <p>
                                You have the right to access, correct, delete, and restrict processing of your personal data. Please contact our Data Protection Officer for any inquiries.
                            </p>
                            <p className="text-xs text-muted-foreground mt-4">
                                Last updated: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
