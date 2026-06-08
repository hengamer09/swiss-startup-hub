import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  count?: number;
}

export default function StarRating({
  value,
  onChange,
  size = "sm",
  count,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            onChange ? "cursor-pointer hover:scale-110" : "cursor-default",
            size === "sm" ? "h-4 w-4" : "h-5 w-5"
          )}
        >
          <Star
            className={cn(
              "h-full w-full",
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-zinc-300"
            )}
          />
        </button>
      ))}
      {count !== undefined && (
        <span className="ml-1 text-xs text-zinc-400">({count})</span>
      )}
    </div>
  );
}
