"use client";

/**
 * @basta/filters - Reusable Filter System
 * Facet filter component for individual filter groups
 */

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FacetFilterProps, Facet } from "../types";

/**
 * Default label renderer - converts camelCase to Title Case
 */
function defaultRenderLabel(value: string): string {
    return value
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .trim();
}

/**
 * Format field name for display
 */
function formatFieldName(fieldName: string): string {
    return fieldName
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .trim();
}

/**
 * Single facet filter group with checkboxes
 */
export function FacetFilter({
    facet,
    selectedValues,
    onToggle,
    onClear,
    renderLabel = defaultRenderLabel,
    showCounts = true,
    maxVisibleItems = 10,
    className,
}: FacetFilterProps) {
    if (!facet.counts || facet.counts.length === 0) {
        return null;
    }

    const hasSelected = selectedValues.length > 0;

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                    {formatFieldName(facet.fieldName)}
                </h3>
                {hasSelected && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={onClear}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            <div
                className={cn(
                    "space-y-1",
                    facet.counts.length > maxVisibleItems && "max-h-64 overflow-y-auto pr-2"
                )}
            >
                {facet.counts.map((count) => {
                    const isSelected = selectedValues.includes(count.value);
                    const displayLabel = renderLabel(count.value, facet);

                    return (
                        <div
                            key={count.value}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                            onClick={() => onToggle(count.value)}
                        >
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggle(count.value)}
                            />
                            <label className="text-sm flex-1 cursor-pointer select-none">
                                {displayLabel}
                            </label>
                            {showCounts && (
                                <span className="text-xs text-muted-foreground">
                                    ({count.count})
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Boolean facet filter (e.g., "Reserve Met")
 * Shows as a single checkbox instead of listing all values
 */
export function BooleanFacetFilter({
    facet,
    selectedValues,
    onToggle,
    onClear,
    label,
    showCounts = true,
    className,
}: Omit<FacetFilterProps, "renderLabel" | "maxVisibleItems"> & {
    label?: string;
}) {
    if (!facet.counts || facet.counts.length === 0) {
        return null;
    }

    // Find the "true" value from counts
    const trueValue = facet.counts.find(
        (count) =>
            count.value.toLowerCase() === "true" ||
            count.value.toLowerCase() === "yes" ||
            count.value === "1"
    );

    const valueToUse = trueValue?.value || facet.counts[0]?.value;
    const countToShow = trueValue?.count || facet.counts[0]?.count || 0;
    const isSelected = selectedValues.length > 0 && selectedValues.includes(valueToUse);
    const displayLabel = label || formatFieldName(facet.fieldName);

    if (!valueToUse) return null;

    const handleToggle = () => {
        if (isSelected) {
            onClear();
        } else {
            onToggle(valueToUse);
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{displayLabel}</h3>
                {isSelected && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={onClear}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            <div
                className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                onClick={handleToggle}
            >
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={handleToggle}
                />
                <label className="text-sm flex-1 cursor-pointer select-none">
                    Yes
                </label>
                {showCounts && countToShow > 0 && (
                    <span className="text-xs text-muted-foreground">
                        ({countToShow})
                    </span>
                )}
            </div>
        </div>
    );
}

export default FacetFilter;

