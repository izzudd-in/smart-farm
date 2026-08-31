"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type DatePickerProps = {
  id?: string;
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DAY_NAMES = [
  "Min",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
];

function padZero(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDateString(year: number, monthIndex: number, day: number): string {
  return `${year}-${padZero(monthIndex + 1)}-${padZero(day)}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const monthName = MONTH_NAMES[month - 1] ?? "";
  return `${day} ${monthName} ${year}`;
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  min,
  max,
  disabled = false,
  placeholder = "Pilih tanggal",
  className = "",
}: DatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Initialize view month/year based on value or today
  const initialDate = value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date();

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [prevValue, setPrevValue] = useState(value);

  if (prevValue !== value) {
    setPrevValue(value);
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }

  // Close calendar on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleSelectDay(day: number) {
    const selectedDateStr = formatDateString(viewYear, viewMonth, day);
    onChange(selectedDateStr);
    setIsOpen(false);
  }

  function handleQuickSelect(type: "today" | "tomorrow" | "yesterday") {
    const today = new Date();
    if (type === "yesterday") {
      today.setDate(today.getDate() - 1);
    } else if (type === "tomorrow") {
      today.setDate(today.getDate() + 1);
    }
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    const str = formatDateString(year, month, day);
    onChange(str);
    setViewYear(year);
    setViewMonth(month);
    setIsOpen(false);
  }

  // Calculate calendar grid days
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayStr = (() => {
    const t = new Date();
    return formatDateString(t.getFullYear(), t.getMonth(), t.getDate());
  })();

  const calendarDays: Array<{
    day: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isDisabled: boolean;
    isSelected: boolean;
    isToday: boolean;
  }> = [];

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateString(viewYear, viewMonth, d);
    const isDisabled = Boolean(
      (min && dateStr < min) || (max && dateStr > max),
    );
    calendarDays.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isDisabled,
      isSelected: value === dateStr,
      isToday: todayStr === dateStr,
    });
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-1.5 ${className}`}
    >
      {label ? (
        <label
          htmlFor={id}
          className="text-[13px] font-medium text-foreground"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={[
            "flex h-11 w-full items-center justify-between rounded-[10px] border border-border bg-white px-3.5 text-left text-sm transition-all outline-none",
            disabled
              ? "cursor-not-allowed bg-[#F3F4F6] text-muted-light"
              : "text-foreground hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/15",
            isOpen ? "border-primary ring-2 ring-primary/15" : "",
          ].join(" ")}
        >
          <span className={value ? "text-foreground font-medium" : "text-muted-light"}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-muted shrink-0 ml-2" />
        </button>
      </div>

      {isOpen && !disabled ? (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-72 sm:w-80 rounded-xl border border-border bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          {/* Header Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-[#F3F4F6] hover:text-foreground transition-colors"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-semibold text-foreground">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-[#F3F4F6] hover:text-foreground transition-colors"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-1.5 pt-2.5 pb-2">
            <button
              type="button"
              onClick={() => handleQuickSelect("yesterday")}
              className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-muted hover:bg-primary-soft hover:text-primary transition-colors"
            >
              Kemarin
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect("today")}
              className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-muted hover:bg-primary-soft hover:text-primary transition-colors"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => handleQuickSelect("tomorrow")}
              className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-muted hover:bg-primary-soft hover:text-primary transition-colors"
            >
              Besok
            </button>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted py-1.5">
            {DAY_NAMES.map((name, i) => (
              <span key={name} className={i === 0 ? "text-danger" : ""}>
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty slots for first week padding */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}

            {calendarDays.map((item) => (
              <button
                key={item.dateStr}
                type="button"
                disabled={item.isDisabled}
                onClick={() => handleSelectDay(item.day)}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all",
                  item.isDisabled
                    ? "cursor-not-allowed opacity-30 text-muted"
                    : item.isSelected
                      ? "bg-primary text-white font-bold shadow-sm"
                      : item.isToday
                        ? "border border-primary text-primary hover:bg-primary-soft"
                        : "text-foreground hover:bg-[#F3F4F6]",
                ].join(" ")}
              >
                {item.day}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
