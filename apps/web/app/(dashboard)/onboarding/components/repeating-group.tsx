"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type RepeatingGroupProps<T> = {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: T) => void;
  renderItem: (item: T, index: number, onUpdate: (item: T) => void) => React.ReactNode;
  getItemTitle: (item: T, index: number) => string;
  addButtonText: string;
  minItems?: number;
  maxItems?: number;
  emptyMessage?: string;
};

export function RepeatingGroup<T>({
  items,
  onAdd,
  onRemove,
  onUpdate,
  renderItem,
  getItemTitle,
  addButtonText,
  minItems = 0,
  maxItems = 10,
  emptyMessage = "No items added yet.",
}: RepeatingGroupProps<T>) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(
    new Set(items.map((_, i) => i))
  );

  const toggleExpanded = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAdd = () => {
    onAdd();
    // Expand the newly added item
    setExpandedItems((prev) => new Set([...prev, items.length]));
  };

  const handleRemove = (index: number) => {
    onRemove(index);
    // Update expanded items indices
    setExpandedItems((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) {
          next.add(i);
        } else if (i > index) {
          next.add(i - 1);
        }
      });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <section key={index} className="overflow-hidden">
              <div
                className={cn(
                  "py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors",
                  expandedItems.has(index) && "border-b"
                )}
                onClick={() => toggleExpanded(index)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">
                    {getItemTitle(item, index)}
                  </h3>
                  <div className="flex items-center gap-2">
                    {items.length > minItems && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(index);
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {expandedItems.has(index) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
              {expandedItems.has(index) && (
                <div className="pt-4">
                  {renderItem(item, index, (updatedItem) =>
                    onUpdate(index, updatedItem)
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {items.length < maxItems && (
        <Button
          type="button"
          variant="secondary"
          onClick={handleAdd}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          {addButtonText}
        </Button>
      )}
    </div>
  );
}
