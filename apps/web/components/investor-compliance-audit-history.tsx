
import { format } from "date-fns";
import {
  ShieldCheck,
  ShieldX,
  ShieldQuestion,
  AlertTriangle,
  Key,
  FileText,
  UserCog,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type AuditEntry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  previousValue: unknown;
  newValue: unknown;
  metadata: unknown;
  performedByName: string | null;
  createdAt: Date;
};

// Type guards and helpers for safely accessing audit entry values
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getRecordValue = (obj: unknown, key: string): unknown => {
  if (!isRecord(obj)) return undefined;
  return obj[key];
};

type AuditHistoryProps = {
  entries: AuditEntry[];
};

const ACTION_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; color: string }
> = {
  clearance_set: { icon: ShieldCheck, label: "Clearance Updated", color: "text-blue-600" },
  permission_granted: { icon: Key, label: "Permission Granted", color: "text-green-600" },
  permission_revoked: { icon: Key, label: "Permission Revoked", color: "text-red-600" },
  role_granted: { icon: UserCog, label: "Role Granted", color: "text-purple-600" },
  role_revoked: { icon: UserCog, label: "Role Revoked", color: "text-orange-600" },
  document_uploaded: { icon: FileText, label: "Document Uploaded", color: "text-blue-600" },
  document_published: { icon: FileText, label: "Document Published", color: "text-green-600" },
  user_created: { icon: UserCog, label: "User Created", color: "text-blue-600" },
  user_updated: { icon: UserCog, label: "User Updated", color: "text-blue-600" },
};

const getClearanceStatusIcon = (status: string) => {
  switch (status) {
    case "cleared":
      return <ShieldCheck className="h-4 w-4 text-green-600" />;
    case "cleared_with_conditions":
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case "rejected":
      return <ShieldX className="h-4 w-4 text-red-600" />;
    default:
      return <ShieldQuestion className="h-4 w-4 text-muted-foreground" />;
  }
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export function AuditHistory({ entries }: AuditHistoryProps) {
  if (entries.length === 0) {
    return (
      <section className="flex flex-col gap-5 border-y border-border py-5">
        <header className="space-y-1.5">
          <h2 className="text-base font-semibold leading-none">Audit History</h2>
          <p className="text-sm text-muted-foreground">No audit events recorded</p>
        </header>
        <div>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No audit events found for this investor</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 border-y border-border py-5">
      <header className="space-y-1.5">
        <h2 className="text-base font-semibold leading-none">Audit History</h2>
        <p className="text-sm text-muted-foreground">
          {entries.length} event(s) recorded for this investor
        </p>
      </header>
      <div>
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {entries.map((entry, index) => {
                const config = ACTION_CONFIG[entry.action] || {
                  icon: History,
                  label: entry.action.replace(/_/g, " "),
                  color: "text-muted-foreground",
                };
                const Icon = config.icon;

                return (
                  <div key={entry.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2 w-5 h-5 rounded-full bg-background border-2 flex items-center justify-center ${config.color}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{config.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>

                      {entry.performedByName && (
                        <p className="text-xs text-muted-foreground">
                          By: {entry.performedByName}
                        </p>
                      )}

                      {/* Show clearance status changes */}
                      {entry.action === "clearance_set" && isRecord(entry.newValue) && (
                        <div className="flex items-center gap-2 mt-2">
                          {isRecord(entry.previousValue) && (
                            <>
                              <Badge variant="outline" className="gap-1">
                                {getClearanceStatusIcon(String(getRecordValue(entry.previousValue, "status") || ""))}
                                {String(getRecordValue(entry.previousValue, "status") || "").replace(/_/g, " ")}
                              </Badge>
                              <span className="text-muted-foreground">→</span>
                            </>
                          )}
                          <Badge variant="secondary" className="gap-1">
                            {getClearanceStatusIcon(String(getRecordValue(entry.newValue, "status") || ""))}
                            {String(getRecordValue(entry.newValue, "status") || "").replace(/_/g, " ")}
                          </Badge>
                        </div>
                      )}

                      {/* Show conditions if any */}
                      {(() => {
                        if (entry.action !== "clearance_set" || !isRecord(entry.newValue)) return null;
                        const conditions = getRecordValue(entry.newValue, "conditions");
                        if (!Array.isArray(conditions) || conditions.length === 0) return null;
                        return (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Conditions:</p>
                            <ul className="text-xs space-y-1">
                              {(conditions as string[]).map((condition, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <span className="text-muted-foreground">•</span>
                                  {condition}
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}

                      {/* Show permission changes */}
                      {(entry.action === "permission_granted" ||
                        entry.action === "permission_revoked") &&
                        isRecord(entry.newValue) && (
                          <div className="mt-2 text-xs">
                            <p className="text-muted-foreground">
                              Deal: {String(getRecordValue(entry.newValue, "dealId") || entry.targetId.split(":")[1])}
                            </p>
                            {entry.action === "permission_granted" && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {!!getRecordValue(entry.newValue, "canViewTeaser") && (
                                  <Badge variant="outline" className="text-xs">
                                    View Teaser
                                  </Badge>
                                )}
                                {!!getRecordValue(entry.newValue, "canViewDocuments") && (
                                  <Badge variant="outline" className="text-xs">
                                    View Documents
                                  </Badge>
                                )}
                                {!!getRecordValue(entry.newValue, "canExpressInterest") && (
                                  <Badge variant="outline" className="text-xs">
                                    Express Interest
                                  </Badge>
                                )}
                                {!!getRecordValue(entry.newValue, "canInvest") && (
                                  <Badge variant="outline" className="text-xs">
                                    Can Invest
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                      {/* Show notes/metadata */}
                      {isRecord(entry.metadata) && !!getRecordValue(entry.metadata, "notes") && (
                        <div className="mt-2 p-2 bg-background rounded text-xs">
                          <p className="text-muted-foreground">Notes:</p>
                          <p>{String(getRecordValue(entry.metadata, "notes"))}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}
