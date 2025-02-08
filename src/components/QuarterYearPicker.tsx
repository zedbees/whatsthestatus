import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface QuarterYearPickerProps {
  onSelect: (value: string) => void;
  selectedValue?: string;
}

export function QuarterYearPicker({ onSelect, selectedValue }: QuarterYearPickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {quarters.map((quarter) => (
            <Button
              key={quarter}
              variant="outline"
              size="sm"
              className={cn(
                "h-8 w-12",
                selectedValue?.includes(quarter) && "bg-primary text-primary-foreground"
              )}
              onClick={() => onSelect(`${quarter}-${currentYear}`)}
            >
              {quarter}
            </Button>
          ))}
        </div>
        <Select
          value={selectedValue?.split('-')[1] || currentYear.toString()}
          onValueChange={(year) => {
            const quarter = selectedValue?.split('-')[0] || 'Q1';
            onSelect(`${quarter}-${year}`);
          }}
        >
          <SelectTrigger className="w-[100px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or pick a specific date
          </span>
        </div>
      </div>
    </div>
  );
} 