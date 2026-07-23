import {
  getLimaDateTimeParts,
  type DateTimeValue,
} from "@/shared/utils/dateTime";

interface DateTimeDisplayProps {
  value: DateTimeValue;
  className?: string;
}

const DateTimeDisplay = ({ value, className }: DateTimeDisplayProps) => {
  const formatted = getLimaDateTimeParts(value);
  const classes = `inline-flex flex-col leading-tight ${className ?? ""}`.trim();

  if (!formatted.iso) return <span className={classes}>{formatted.date}</span>;

  return (
    <time dateTime={formatted.iso} className={classes}>
      <span>{formatted.date}</span>
      <span className="mt-1 text-xs font-medium text-base-content/55">
        {formatted.time}
      </span>
    </time>
  );
};

export default DateTimeDisplay;
