"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KycData } from "./onboarding-flow";
import {
  AlertCircle,
  Upload,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Hoist static arrays (rendering optimization 6.3, JS performance 7.1)
const VALID_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

type KycDocumentsProps = {
  initialData: Partial<KycData>;
  investorType: string;
  onSubmit: (data: KycData) => void;
  onBack: () => void;
  isSubmitting: boolean;
};

type DocumentType = keyof KycData;

type DocumentInfo = {
  title: string;
  description: string;
  examples: string;
};

type DocumentRequirements = {
  required: string[];
  documents: Record<string, DocumentInfo>;
};

// Document requirements by investor type
const DOCUMENT_REQUIREMENTS: Record<string, DocumentRequirements> = {
  "individual-investor-including-hnwis": {
    required: [
      "identification",
      "proofOfAddress",
      "w9OrW8BEN",
      "fatcaCrsSelfCertification",
      "sourceOfWealthDeclaration",
      "pepDeclaration",
    ],
    documents: {
      identification: {
        title: "Government-Issued Photo ID",
        description: "Passport, driver's license, or national ID card",
        examples: "Accepted: PDF, JPG, PNG (max 5MB)",
      },
      proofOfAddress: {
        title: "Proof of Address",
        description:
          "Utility bill, bank statement, or lease agreement (dated within last 3 months)",
        examples: "Accepted: PDF, JPG, PNG (max 5MB)",
      },
      w9OrW8BEN: {
        title: "W-9 (U.S. persons) or W-8BEN (non-U.S.)",
        description: "Self-certification tax form",
        examples: "Accepted: PDF (max 5MB)",
      },
      fatcaCrsSelfCertification: {
        title: "FATCA/CRS Self-Certification",
        description: "FATCA and CRS self-certification form",
        examples: "Accepted: PDF (max 5MB)",
      },
      sourceOfWealthDeclaration: {
        title: "Source of Wealth/Funds Declaration",
        description:
          "Short narrative or questionnaire describing how the wealth was acquired (e.g., business income, inheritance, sale of a company)",
        examples: "Accepted: PDF, DOC, DOCX (max 5MB)",
      },
      pepDeclaration: {
        title: "PEP Declaration",
        description:
          "Declaration whether the individual is a Politically Exposed Person",
        examples: "Accepted: PDF, DOC, DOCX (max 5MB)",
      },
    },
  },
  "corporate-entitiesllcs-corporations": {
    required: [
      "certificateOfIncorporation",
      "certificateOfGoodStanding",
      "registerOfDirectorsShareholders",
      "ownershipChart",
      "companyBylaws",
      "authorizedSignatoryList",
      "uboIdAndAddress",
      "taxFormsCorporate",
      "fatcaCrsCorporate",
    ],
    documents: {
      certificateOfIncorporation: {
        title: "Certificate of Incorporation",
        description: "Official certificate of incorporation",
        examples: "Accepted: PDF (max 5MB)",
      },
      certificateOfGoodStanding: {
        title: "Certificate of Good Standing",
        description: "Current certificate of good standing",
        examples: "Accepted: PDF (max 5MB)",
      },
      registerOfDirectorsShareholders: {
        title: "Register of Directors and Shareholders",
        description: "Current register showing directors and shareholders",
        examples: "Accepted: PDF (max 5MB)",
      },
      ownershipChart: {
        title: "Ownership Chart",
        description: "Ownership structure chart (if multi-layered)",
        examples: "Accepted: PDF, PNG, JPG (max 5MB)",
      },
      companyBylaws: {
        title: "Company Bylaws or Articles of Association",
        description: "Current bylaws or articles of association",
        examples: "Accepted: PDF (max 5MB)",
      },
      authorizedSignatoryList: {
        title: "Authorized Signatory List or Board Resolution",
        description: "List of authorized signatories or board resolution",
        examples: "Accepted: PDF (max 5MB)",
      },
      uboIdAndAddress: {
        title: "ID and Proof of Address for UBOs",
        description:
          "Government-issued ID and proof of address for Ultimate Beneficial Owners (≥10%-25%)",
        examples: "Accepted: PDF, JPG, PNG (max 5MB)",
      },
      lei: {
        title: "LEI (Legal Entity Identifier)",
        description: "Legal Entity Identifier if applicable",
        examples: "Accepted: PDF (max 5MB)",
      },
      taxFormsCorporate: {
        title: "Tax Forms (W-8BEN-E or W-9)",
        description: "Appropriate tax forms for corporate entities",
        examples: "Accepted: PDF (max 5MB)",
      },
      fatcaCrsCorporate: {
        title: "FATCA/CRS Classification & Self-Certification",
        description: "FATCA and CRS classification documentation",
        examples: "Accepted: PDF (max 5MB)",
      },
    },
  },
  "trusts-and-foundations": {
    required: [
      "trustDeed",
      "trustDetails",
      "trustIdAndAddress",
      "taxFormsTrust",
      "sourceOfWealthSettlor",
      "fatcaCrsTrust",
    ],
    documents: {
      trustDeed: {
        title: "Trust Deed or Formation Documents",
        description: "Trust deed or foundation formation documents",
        examples: "Accepted: PDF (max 5MB)",
      },
      trustDetails: {
        title: "Details of Settlor, Trustee(s), Protector, and Beneficiaries",
        description:
          "Documentation showing details of all individuals involved",
        examples: "Accepted: PDF, DOC, DOCX (max 5MB)",
      },
      trustIdAndAddress: {
        title: "ID and Address for All Individuals Involved",
        description:
          "Government-issued ID and proof of address for settlor, trustee(s), protector (if applicable), and beneficiaries",
        examples: "Accepted: PDF, JPG, PNG (max 5MB)",
      },
      taxFormsTrust: {
        title: "Tax Forms (W-8/W-9)",
        description: "Appropriate tax forms for trusts and foundations",
        examples: "Accepted: PDF (max 5MB)",
      },
      sourceOfWealthSettlor: {
        title: "Source of Wealth for Settlor",
        description:
          "Documentation describing the source of wealth for the settlor",
        examples: "Accepted: PDF, DOC, DOCX (max 5MB)",
      },
      fatcaCrsTrust: {
        title: "FATCA/CRS Documentation",
        description: "FATCA and CRS documentation for trusts and foundations",
        examples: "Accepted: PDF (max 5MB)",
      },
    },
  },
  "partnerships-or-lps": {
    required: [
      "partnershipAgreement",
      "certificateOfRegistration",
      "authorizedSignatoryListPartnership",
      "partnerIdAndAddress",
      "ownershipChartPartnership",
      "taxFormsPartnership",
      "fatcaCrsPartnership",
    ],
    documents: {
      partnershipAgreement: {
        title: "Partnership Agreement",
        description: "Current partnership agreement or LP agreement",
        examples: "Accepted: PDF (max 5MB)",
      },
      certificateOfRegistration: {
        title: "Certificate of Registration",
        description: "Certificate of registration for the partnership or LP",
        examples: "Accepted: PDF (max 5MB)",
      },
      authorizedSignatoryListPartnership: {
        title: "Authorized Signatory List",
        description: "List of authorized signatories for the partnership",
        examples: "Accepted: PDF (max 5MB)",
      },
      partnerIdAndAddress: {
        title: "ID and Address for General Partners and Major LPs",
        description:
          "Government-issued ID and proof of address for general partners and major limited partners",
        examples: "Accepted: PDF, JPG, PNG (max 5MB)",
      },
      ownershipChartPartnership: {
        title: "Ownership Chart",
        description: "Ownership structure chart for the partnership",
        examples: "Accepted: PDF, PNG, JPG (max 5MB)",
      },
      taxFormsPartnership: {
        title: "Tax Forms",
        description: "Appropriate tax forms for partnerships or LPs",
        examples: "Accepted: PDF (max 5MB)",
      },
      fatcaCrsPartnership: {
        title: "FATCA/CRS Details",
        description: "FATCA and CRS documentation for partnerships or LPs",
        examples: "Accepted: PDF (max 5MB)",
      },
    },
  },
};

export function KycDocuments({
  initialData,
  investorType,
  onSubmit,
  onBack,
  isSubmitting,
}: KycDocumentsProps) {
  const [documents, setDocuments] = useState<Partial<KycData>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState<DocumentType | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    file: File;
    type: DocumentType;
    title: string;
  } | null>(null);

  // Create object URLs for preview
  const previewUrl = useMemo(() => {
    if (!previewFile) return null;
    return URL.createObjectURL(previewFile.file);
  }, [previewFile]);

  // Clean up object URLs when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Get document requirements for the selected investor type - memoize (re-render optimization 5.1)
  const requirements = useMemo(
    () =>
      DOCUMENT_REQUIREMENTS[
        investorType as keyof typeof DOCUMENT_REQUIREMENTS
      ] || DOCUMENT_REQUIREMENTS["individual-investor-including-hnwis"],
    [investorType]
  );

  // Memoize handleFileChange callback (re-render optimization 5.5)
  const handleFileChange = useCallback(
    (type: DocumentType, file: File | null) => {
      if (file) {
        // Validate file size (5MB) - hoist constant (JS performance 7.1)
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
          setErrors((prev) => ({
            ...prev,
            [type]: "File size must be less than 5MB",
          }));
          return;
        }

        // Validate file type - use hoisted VALID_FILE_TYPES (JS performance 7.11)
        if (
          !VALID_FILE_TYPES.includes(
            file.type as (typeof VALID_FILE_TYPES)[number]
          )
        ) {
          setErrors((prev) => ({
            ...prev,
            [type]: "File must be PDF, JPG, PNG, DOC, or DOCX",
          }));
          return;
        }
      }

      setDocuments((prev) => ({ ...prev, [type]: file }));
      setErrors((prev) => {
        // Early exit if no error to clear (JS performance 7.7)
        if (!prev[type]) return prev;
        const next = { ...prev };
        delete next[type];
        return next;
      });
    },
    []
  );

  // Memoize drag handlers (re-render optimization 5.5)
  const handleDrop = useCallback(
    (e: React.DragEvent, type: DocumentType) => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileChange(type, file);
      }
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, type: DocumentType) => {
      e.preventDefault();
      setDragOver(type);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOver(null);
  }, []);

  // Memoize validate function (re-render optimization 5.2)
  const validate = useCallback((): {
    isValid: boolean;
    firstErrorKey?: string;
  } => {
    const newErrors: Record<string, string> = {};
    let firstErrorKey: string | undefined;

    // Validate all required documents for the investor type
    // Cache array length (JS performance 7.6)
    const requiredDocs = requirements?.required;
    if (requiredDocs) {
      const requiredLength = requiredDocs.length;
      for (let i = 0; i < requiredLength; i++) {
        const docType = requiredDocs[i];
        if (!documents[docType as DocumentType]) {
          const docInfo = requirements?.documents?.[docType] as
            | DocumentInfo
            | undefined;
          if (docInfo) {
            newErrors[docType] = `${docInfo.title} is required`;
            // Track the first error encountered
            if (!firstErrorKey) {
              firstErrorKey = docType;
            }
          }
        }
      }
    }

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      firstErrorKey,
    };
  }, [documents, requirements]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const validationResult = validate();
      if (validationResult.isValid) {
        // Create a complete KycData object with all fields
        const completeKycData: KycData = {
          identification: documents.identification || null,
          proofOfAddress: documents.proofOfAddress || null,
          w9OrW8BEN: documents.w9OrW8BEN || null,
          fatcaCrsSelfCertification:
            documents.fatcaCrsSelfCertification || null,
          sourceOfWealthDeclaration:
            documents.sourceOfWealthDeclaration || null,
          pepDeclaration: documents.pepDeclaration || null,
          certificateOfIncorporation:
            documents.certificateOfIncorporation || null,
          certificateOfGoodStanding:
            documents.certificateOfGoodStanding || null,
          registerOfDirectorsShareholders:
            documents.registerOfDirectorsShareholders || null,
          ownershipChart: documents.ownershipChart || null,
          companyBylaws: documents.companyBylaws || null,
          authorizedSignatoryList: documents.authorizedSignatoryList || null,
          uboIdAndAddress: documents.uboIdAndAddress || null,
          lei: documents.lei || null,
          taxFormsCorporate: documents.taxFormsCorporate || null,
          fatcaCrsCorporate: documents.fatcaCrsCorporate || null,
          trustDeed: documents.trustDeed || null,
          trustDetails: documents.trustDetails || null,
          trustIdAndAddress: documents.trustIdAndAddress || null,
          taxFormsTrust: documents.taxFormsTrust || null,
          sourceOfWealthSettlor: documents.sourceOfWealthSettlor || null,
          fatcaCrsTrust: documents.fatcaCrsTrust || null,
          partnershipAgreement: documents.partnershipAgreement || null,
          certificateOfRegistration:
            documents.certificateOfRegistration || null,
          authorizedSignatoryListPartnership:
            documents.authorizedSignatoryListPartnership || null,
          partnerIdAndAddress: documents.partnerIdAndAddress || null,
          ownershipChartPartnership:
            documents.ownershipChartPartnership || null,
          taxFormsPartnership: documents.taxFormsPartnership || null,
          fatcaCrsPartnership: documents.fatcaCrsPartnership || null,
        };
        onSubmit(completeKycData);
      } else {
        // Scroll to first error that occurred during validation
        if (validationResult.firstErrorKey) {
          const firstErrorField = document.querySelector(
            `[data-document-type="${validationResult.firstErrorKey}"]`
          );
          firstErrorField?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    },
    [validate, documents, onSubmit]
  );

  // Memoize renderFileUpload function (re-render optimization 5.2)
  const renderFileUpload = useCallback(
    (type: DocumentType) => {
      const info = requirements?.documents?.[type] as DocumentInfo | undefined;
      if (!info) return null;

      const file = documents[type];
      const hasError = !!errors[type];
      const isRequired = requirements?.required?.includes(type);

      return (
        <div key={type} className="space-y-2">
          <Label htmlFor={type}>
            {info.title}{" "}
            {isRequired && <span className="text-destructive">{"*"}</span>}
          </Label>
          <p className="text-sm text-muted-foreground">{info.description}</p>

          <div
            data-document-type={type}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 transition-all",
              dragOver === type && "border-primary bg-accent",
              hasError && "border-destructive",
              !hasError &&
                !file &&
                "border-border hover:border-muted-foreground",
              file && !hasError && "border-primary bg-primary/10"
            )}
            onDrop={(e) => handleDrop(e, type)}
            onDragOver={(e) => handleDragOver(e, type)}
            onDragLeave={handleDragLeave}
          >
            <input
              id={type}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) =>
                handleFileChange(type, e.target.files?.[0] || null)
              }
              className="sr-only"
            />

            {!file ? (
              <label
                htmlFor={type}
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload
                  className={cn(
                    "w-10 h-10 mb-3",
                    hasError ? "text-destructive" : "text-muted-foreground"
                  )}
                />
                <p className="text-sm font-medium mb-1">
                  {"Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">{info.examples}</p>
              </label>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setPreviewFile({ file, type, title: info.title })
                    }
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {"Preview"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleFileChange(type, null)}
                  >
                    {"Remove"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {errors[type] && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors[type]}
            </p>
          )}
        </div>
      );
    },
    [
      documents,
      errors,
      requirements,
      dragOver,
      handleFileChange,
      handleDrop,
      handleDragOver,
      handleDragLeave,
      setPreviewFile,
    ]
  );

  // Get investor type display name - memoize (re-render optimization 5.1)
  const getInvestorTypeDisplayName = useMemo(() => {
    const typeMap: Record<string, string> = {
      "individual-investor-including-hnwis":
        "Individual Investors (including HNWIs)",
      "corporate-entitiesllcs-corporations":
        "Corporate Entities (LLCs, Corporations)",
      "trusts-and-foundations": "Trusts and Foundations",
      "partnerships-or-lps": "Partnerships or LPs",
    };
    return typeMap[investorType] || "Investor";
  }, [investorType]);

  const renderPreview = () => {
    if (!previewFile || !previewUrl) return null;

    const fileType = previewFile.file.type;
    const isImage = fileType.startsWith("image/");
    const isPdf = fileType === "application/pdf";
    const isWordDoc =
      fileType === "application/msword" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    return (
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewFile.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {isImage ? (
              <div className="flex items-center justify-center p-4">
                <img
                  src={previewUrl}
                  alt={previewFile.file.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            ) : isPdf ? (
              <div className="w-full h-[70vh]">
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-lg border"
                  title={previewFile.file.name}
                />
              </div>
            ) : isWordDoc ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {"Word Document Preview"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {
                    "Word documents cannot be previewed in the browser. Please download the file to view it."
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {"File: "}
                  <span className="font-mono">{previewFile.file.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {"Size: "}
                  {(previewFile.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {"Document Preview Not Available"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {"This file type cannot be previewed in the browser."}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  {"File: "}
                  <span className="font-mono">{previewFile.file.name}</span>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{"KYC Verification"}</h2>
          <p className="text-muted-foreground text-sm">
            {
              "Upload the required documents to verify your identity and complete the onboarding process"
            }
          </p>
          {investorType && (
            <p className="text-sm font-medium mt-2">
              Investor Type:{" "}
              <span className="text-primary">{getInvestorTypeDisplayName}</span>
            </p>
          )}
        </div>

        <div className="space-y-6">
          {Object.keys(requirements?.documents || {}).map((docType) =>
            renderFileUpload(docType as DocumentType)
          )}
        </div>

        <div className="bg-accent border border-border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {"Important Information"}
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
            <li>{"All documents must be clear and legible"}</li>
            <li>{"Documents should not be expired"}</li>
            <li>{"File size should not exceed 5MB per document"}</li>
            <li>{"Accepted formats: PDF, JPG, PNG, DOC, DOCX"}</li>
            <li>{"Your information will be kept secure and confidential"}</li>
          </ul>
        </div>

        {/* Error Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <h4 className="font-semibold text-destructive">
                Please fix the following errors:
              </h4>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onBack}
            disabled={isSubmitting}
            className="gap-2 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            {"Back"}
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="flex-1 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {"Saving..."}
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </div>
      </form>
      {renderPreview()}
    </>
  );
}
