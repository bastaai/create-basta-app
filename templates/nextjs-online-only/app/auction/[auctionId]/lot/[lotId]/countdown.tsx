"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { SaleItemDataType } from "./page";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalHours: number;
}

/**
 * Hook to calculate time remaining until a target date
 * Updates every second and returns formatted time units
 */
function useCountdown(targetDate: string | null): TimeLeft {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false,
        totalHours: 0,
    });

    useEffect(() => {
        if (!targetDate) return;

        const calculateTimeLeft = (): TimeLeft => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const difference = target - now;

            if (difference <= 0) {
                return {
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isExpired: true,
                    totalHours: 0,
                };
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            const totalHours = Math.floor(difference / (1000 * 60 * 60));

            return {
                days,
                hours,
                minutes,
                seconds,
                isExpired: false,
                totalHours,
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return timeLeft;
}

interface CountdownDisplayProps {
    closingDate: string | null;
    onExpiredChange?: (isExpired: boolean) => void;
    variant?: "compact" | "detailed";
    status: SaleItemDataType["status"];
}

/**
 * Countdown timer component with urgency indicators
 * Isolated to prevent parent re-renders on every tick
 */
export const CountdownDisplay = ({
    closingDate,
    status,
    onExpiredChange,
    variant = "compact",
}: CountdownDisplayProps) => {
    const countdown = useCountdown(closingDate);

    // Notify parent when expired status changes
    useEffect(() => {
        onExpiredChange?.(countdown.isExpired);
    }, [countdown.isExpired, onExpiredChange]);

    // Styling based on status
    const getIndicatorColor = () => {
        switch (status) {
            case "ITEM_NOT_OPEN":
                return "bg-blue-500";
            case "ITEM_OPEN":
                return "bg-green-500 animate-pulse";
            case "ITEM_CLOSING":
                return "bg-orange-500 animate-pulse";
            case "ITEM_CLOSED":
                return "bg-foreground/40";
            default:
                return "bg-foreground/40";
        }
    };

    const indicatorColor = getIndicatorColor();

    if (status === "ITEM_CLOSED" || countdown.isExpired) {
        return (
            <div className="flex items-center gap-1.5 text-left">
                <span className={`h-2 w-2 rounded-full ${indicatorColor}`} />
                <span className="font-semibold">Closed</span>
            </div>
        );
    }

    if (variant === "detailed") {
        const isUrgent = status === "ITEM_CLOSING" || status === "ITEM_OPEN";
        return (
            <div className="inline-flex items-center gap-3 rounded-lg border bg-background p-3">
                <Clock className={`h-4 w-4 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`} />
                <div className="flex items-center gap-2">
                    {countdown.days > 0 && (
                        <TimeUnit value={countdown.days} label="day" isUrgent={isUrgent} />
                    )}
                    <TimeUnit value={countdown.hours} label="hr" isUrgent={isUrgent} />
                    <TimeUnit value={countdown.minutes} label="min" isUrgent={isUrgent} />
                    <TimeUnit value={countdown.seconds} label="sec" isUrgent={isUrgent} />
                </div>
            </div>
        );
    }

    // Compact variant (default)
    const formatTime = () => {
        if (countdown.days > 0) {
            return `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m`;
        }
        if (countdown.hours > 0) {
            return `${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;
        }
        return `${countdown.minutes}m ${countdown.seconds}s`;
    };

    return (
        <div className="flex items-center gap-1.5 font-mono text-left">
            <span className={`h-2 w-2 rounded-full ${indicatorColor}`} />
            <span className="font-semibold">{formatTime()}</span>
        </div>
    );
};

/**
 * Time unit display component for detailed variant
 */
const TimeUnit = ({
    value,
    label,
    isUrgent,
}: {
    value: number;
    label: string;
    isUrgent: boolean;
}) => {
    return (
        <div className="flex flex-col items-center">
            <span
                className={`text-2xl font-bold tabular-nums ${isUrgent ? "text-destructive" : ""
                    }`}
            >
                {value.toString().padStart(2, "0")}
            </span>
            <span className="text-xs text-muted-foreground uppercase">
                {label}
                {value !== 1 ? "s" : ""}
            </span>
        </div>
    );
};
