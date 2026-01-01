"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InvestmentDocument = {
  id: string;
  investmentId: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileUrl: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  year: string | null;
  uploadedAt: string;
  createdAt: string;
  dealName: string;
  dealId: string;
};

type DocumentsListProps = {
  documents: InvestmentDocument[];
};

const formatFileSize = (bytes: string): string => {
  const num = parseFloat(bytes);
  if (isNaN(num)) return "Unknown";
  if (num >= 1048576) {
    return `${(num / 1048576).toFixed(1)} MB`;
  }
  if (num >= 1024) {
    return `${(num / 1024).toFixed(1)} KB`;
  }
  return `${num} bytes`;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getDocumentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    k1: "K-1 Tax Form",
    quarterly_report: "Quarterly Report",
    annual_report: "Annual Report",
    tax_statement: "Tax Statement",
    distribution_notice: "Distribution Notice",
  };
  return (
    labels[type] ||
    type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

export function DocumentsList({
  documents: initialDocuments,
}: DocumentsListProps) {
  const [filteredDocuments, setFilteredDocuments] = useState<
    InvestmentDocument[]
  >([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDeal, setFilterDeal] = useState<string>("all");

  useEffect(() => {
    filterDocuments();
  }, [initialDocuments, filterType, filterDeal]);

  const filterDocuments = () => {
    let filtered = [...initialDocuments];

    if (filterType !== "all") {
      filtered = filtered.filter((doc) => doc.documentType === filterType);
    }

    if (filterDeal !== "all") {
      filtered = filtered.filter((doc) => doc.dealId === filterDeal);
    }

    setFilteredDocuments(filtered);
  };

  const uniqueDeals = Array.from(
    new Set(initialDocuments.map((doc) => doc.dealId))
  ).map((dealId) => {
    const doc = initialDocuments.find((d) => d.dealId === dealId);
    return { id: dealId, name: doc?.dealName || "Unknown" };
  });

  const uniqueTypes = Array.from(
    new Set(initialDocuments.map((doc) => doc.documentType))
  );

  const handleDownload = (document: InvestmentDocument) => {
    if (document.fileUrl) {
      window.open(document.fileUrl, "_blank");
    } else {
      alert("Document URL not available");
    }
  };

  if (initialDocuments.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No documents available</p>
          <p className="text-sm">
            Documents will appear here once they are uploaded for your
            investments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">
              Document Type
            </label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getDocumentTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Deal</label>
            <Select value={filterDeal} onValueChange={setFilterDeal}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deals</SelectItem>
                {uniqueDeals.map((deal) => (
                  <SelectItem key={deal.id} value={deal.id}>
                    {deal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-6">
          Documents ({filteredDocuments.length})
        </h3>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No documents match your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        {document.fileName}
                      </h4>
                      <Badge variant="outline">
                        {getDocumentTypeLabel(document.documentType)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{document.dealName}</span>
                      {document.year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {document.year}
                        </span>
                      )}
                      {document.periodStart && document.periodEnd && (
                        <span>
                          {formatDate(document.periodStart)} -{" "}
                          {formatDate(document.periodEnd)}
                        </span>
                      )}
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>Uploaded {formatDate(document.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(document)}
                  disabled={!document.fileUrl}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
