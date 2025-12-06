"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { lookupVat } from "@/app/actions/vat-lookup";

interface VatLookupButtonProps {
  vatNumber: string;
  onDataFetched: (data: {
    name?: string;
    commercialTitle?: string;
    address?: string;
    irsOffice?: string;
    city?: string;
    zip?: string;
  }) => void;
}

export function VatLookupButton({ vatNumber, onDataFetched }: VatLookupButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!vatNumber || vatNumber.trim().length === 0) {
      toast.error("Please enter a VAT number first");
      return;
    }

    setLoading(true);
    try {
      const result = await lookupVat(vatNumber);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success && result.data) {
        onDataFetched(result.data);
        toast.success("Company information fetched successfully");
      }
    } catch (error) {
      console.error("VAT lookup error:", error);
      toast.error("Failed to fetch VAT information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleLookup}
      disabled={loading || !vatNumber || vatNumber.trim().length === 0}
      className="h-9 w-9 shrink-0 bg-[#142030] hover:bg-[#142030]/90 border-[#142030] text-white disabled:opacity-50 disabled:cursor-not-allowed"
      title="Lookup company information by VAT number"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : (
        <Search className="h-4 w-4 text-white" />
      )}
    </Button>
  );
}

