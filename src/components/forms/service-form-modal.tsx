"use client";

import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { motion } from "framer-motion";

import { FileUpload } from "@/components/ui/file-upload";

const serviceSchema = z.object({
    code: z.string().min(1, "Service code is required"),
    description: z.string().min(1, "Description is required"),
    price: z.coerce.number().optional(),
    image: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ServiceFormValues) => Promise<void>;
    initialData?: ServiceFormValues & { id?: string };
}

export function ServiceFormModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
}: ServiceFormModalProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            code: "",
            description: "",
            price: undefined,
            image: "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code,
                description: initialData.description,
                price: initialData.price || undefined,
                image: initialData.image || "",
            });
        } else {
            form.reset({
                code: "",
                description: "",
                price: undefined,
                image: "",
            });
        }
    }, [initialData, open, form]);

    const handleSubmit = async (data: ServiceFormValues) => {
        setLoading(true);
        try {
            await onSubmit(data);
            form.reset();
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {initialData ? "Edit Service" : "Create Service"}
                        </DialogTitle>
                        <DialogDescription>
                            {initialData
                                ? "Update the service details below."
                                : "Add a new service to your offering."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Service Code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., VID-PROD" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the service..."
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Image</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="Image URL"
                                                    {...field}
                                                    disabled
                                                    className="bg-muted"
                                                />
                                                <FileUpload
                                                    uploadUrl="/api/media/upload"
                                                    onUploadComplete={(file) => {
                                                        form.setValue("image", file.url);
                                                        toast.success("Image uploaded");
                                                    }}
                                                    className="w-full"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#142030] hover:bg-[#142030]/90 text-white"
                                >
                                    {loading ? "Saving..." : initialData ? "Update Service" : "Create Service"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}
