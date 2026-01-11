"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { COUNTRY_OPTIONS } from "@/lib/countries";

const contactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    lastName: z.string().optional(),
    companyId: z.string().optional(),
    supplierId: z.string().optional(),
    jobPosition: z.string().optional(),
    notes: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    image: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    workPhone: z.string().optional(),
    gender: z.string().optional(),
    birthday: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ContactFormValues) => Promise<void>;
    initialData?: Partial<ContactFormValues>;
    companies?: Array<{ id: string; name: string }>;
    suppliers?: Array<{ id: string; name: string }>;
}

export function ContactFormModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    companies = [],
    suppliers = [],
}: ContactFormModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: initialData?.name ?? "",
            lastName: initialData?.lastName ?? "",
            companyId: initialData?.companyId ?? "",
            supplierId: initialData?.supplierId ?? "",
            jobPosition: initialData?.jobPosition ?? "",
            notes: initialData?.notes ?? "",
            address: initialData?.address ?? "",
            city: initialData?.city ?? "",
            zip: initialData?.zip ?? "",
            country: initialData?.country ?? "",
            image: initialData?.image ?? "",
            email: initialData?.email ?? "",
            phone: initialData?.phone ?? "",
            mobile: initialData?.mobile ?? "",
            workPhone: initialData?.workPhone ?? "",
            gender: initialData?.gender ?? "",
            birthday: initialData?.birthday ? String(initialData.birthday).split('T')[0] : "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                name: initialData?.name ?? "",
                lastName: initialData?.lastName ?? "",
                companyId: initialData?.companyId ?? "",
                supplierId: initialData?.supplierId ?? "",
                jobPosition: initialData?.jobPosition ?? "",
                notes: initialData?.notes ?? "",
                address: initialData?.address ?? "",
                city: initialData?.city ?? "",
                zip: initialData?.zip ?? "",
                country: initialData?.country ?? "",
                image: initialData?.image ?? "",
                email: initialData?.email ?? "",
                phone: initialData?.phone ?? "",
                mobile: initialData?.mobile ?? "",
                workPhone: initialData?.workPhone ?? "",
                gender: initialData?.gender ?? "",
                birthday: initialData?.birthday ? String(initialData.birthday).split('T')[0] : "",
            });
        }
    }, [open, initialData, form]);

    const handleSubmit = async (data: ContactFormValues) => {
        setLoading(true);
        try {
            await onSubmit(data);
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const companyOptions = companies.map(c => ({ value: c.id, label: c.name }));
    const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? "Edit Contact" : "Create New Contact"}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? "Update contact details below."
                            : "Add a new contact to your list."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="john.doe@example.com" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="jobPosition"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Position</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Manager" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="companyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={companyOptions}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Select company"
                                                searchPlaceholder="Search companies..."
                                                emptyMessage="No company found."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="supplierId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={supplierOptions}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Select supplier"
                                                searchPlaceholder="Search suppliers..."
                                                emptyMessage="No supplier found."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1234567890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="mobile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mobile</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1987654321" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="workPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Work Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1122334455" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="MALE">Male</SelectItem>
                                                <SelectItem value="FEMALE">Female</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                                <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="birthday"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Birthday</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Street address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input placeholder="City" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="zip"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ZIP / Postal Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="10001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <FormControl>
                                                <Combobox
                                                    options={COUNTRY_OPTIONS}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Select country"
                                                    searchPlaceholder="Search countries..."
                                                    emptyMessage="No country found."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Additional notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-[#142030] hover:bg-[#142030]/90 text-white">
                                {loading ? "Saving..." : initialData ? "Update Contact" : "Create Contact"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
