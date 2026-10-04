"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ThreeColumnDatePickerProps {
  value?: string | null;
  onChange?: (val: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTHS = [
  { value: 1, label: "01 Ene", fullName: "Enero" },
  { value: 2, label: "02 Feb", fullName: "Febrero" },
  { value: 3, label: "03 Mar", fullName: "Marzo" },
  { value: 4, label: "04 Abr", fullName: "Abril" },
  { value: 5, label: "05 May", fullName: "Mayo" },
  { value: 6, label: "06 Jun", fullName: "Junio" },
  { value: 7, label: "07 Jul", fullName: "Julio" },
  { value: 8, label: "08 Ago", fullName: "Agosto" },
  { value: 9, label: "09 Set", fullName: "Septiembre" },
  { value: 10, label: "10 Oct", fullName: "Octubre" },
  { value: 11, label: "11 Nov", fullName: "Noviembre" },
  { value: 12, label: "12 Dic", fullName: "Diciembre" },
];

function getYearsList() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 2; y <= currentYear + 6; y++) {
    years.push(y);
  }
  return years;
}

function parseDateString(str?: string | null) {
  if (!str) return null;

  // Handles YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.substring(0, 10).split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return { year: y, month: m, day: d };
    }
  }

  // Handles DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const [d, m, y] = str.split("/").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return { year: y, month: m, day: d };
    }
  }

  const dObj = new Date(str);
  if (!isNaN(dObj.getTime())) {
    return {
      year: dObj.getFullYear(),
      month: dObj.getMonth() + 1,
      day: dObj.getDate(),
    };
  }

  return null;
}

function getMaxDays(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function ThreeColumnDatePicker({
  value,
  onChange,
  name,
  id,
  placeholder = "DD / MM / YYYY",
  className = "",
  disabled = false,
}: ThreeColumnDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialParsed = parseDateString(value);
  const now = new Date();

  const [selectedDay, setSelectedDay] = useState<number>(initialParsed?.day || now.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(initialParsed?.month || now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(initialParsed?.year || now.getFullYear());

  const [hasSelectedValue, setHasSelectedValue] = useState<boolean>(Boolean(initialParsed));

  useEffect(() => {
    const parsed = parseDateString(value);
    if (parsed) {
      setSelectedDay(parsed.day);
      setSelectedMonth(parsed.month);
      setSelectedYear(parsed.year);
      setHasSelectedValue(true);
    } else if (value === "" || value === null) {
      setHasSelectedValue(false);
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Clamp days if month changes (e.g. Feb 31 -> Feb 28)
  const maxDaysInMonth = getMaxDays(selectedYear, selectedMonth);
  const currentDay = Math.min(selectedDay, maxDaysInMonth);

  function emitChange(y: number, m: number, d: number) {
    const clampedDay = Math.min(d, getMaxDays(y, m));
    const pad = (n: number) => n.toString().padStart(2, "0");
    const formattedIso = `${y}-${pad(m)}-${pad(clampedDay)}`;
    setHasSelectedValue(true);
    if (onChange) {
      onChange(formattedIso);
    }
  }

  function handleSelectDay(d: number) {
    setSelectedDay(d);
    emitChange(selectedYear, selectedMonth, d);
  }

  function handleSelectMonth(m: number) {
    setSelectedMonth(m);
    emitChange(selectedYear, m, selectedDay);
  }

  function handleSelectYear(y: number) {
    setSelectedYear(y);
    emitChange(y, selectedMonth, selectedDay);
  }

  function handleQuickPreset(offsetDays: number) {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const y = target.getFullYear();
    const m = target.getMonth() + 1;
    const d = target.getDate();

    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
    emitChange(y, m, d);
  }

  function handleClear() {
    setHasSelectedValue(false);
    if (onChange) {
      onChange("");
    }
  }

  const pad = (n: number) => n.toString().padStart(2, "0");
  const isoFormattedValue = hasSelectedValue
    ? `${selectedYear}-${pad(selectedMonth)}-${pad(currentDay)}`
    : "";

  const monthObj = MONTHS.find((m) => m.value === selectedMonth);
  const displayLabel = hasSelectedValue
    ? `${pad(currentDay)} / ${pad(selectedMonth)} / ${selectedYear}`
    : placeholder;

  const yearsList = getYearsList();

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Hidden input for HTML form submissions */}
      {name && <input type="hidden" name={name} id={id} value={isoFormattedValue} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-all shadow-sm ${
          disabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-100 bg-white text-slate-900"
            : hasSelectedValue
            ? "border-slate-300 bg-white text-slate-900 font-semibold hover:border-slate-400"
            : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className={`h-4 w-4 shrink-0 ${hasSelectedValue ? "text-blue-600" : "text-slate-400"}`} />
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
      </button>

      {/* 3-Column Popover Card */}
      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-full sm:w-[380px] rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xl space-y-3 animate-in fade-in-50 zoom-in-95">
          {/* Header & Live Date Preview */}
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fecha Seleccionada</div>
              <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>
                  {pad(currentDay)} de {monthObj?.fullName || ""}, {selectedYear}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 text-[11px] font-semibold transition-colors"
                title="Limpiar fecha"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickPreset(0)}
              className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 font-semibold transition-colors shrink-0"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(1)}
              className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 font-semibold transition-colors shrink-0"
            >
              Mañana
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(7)}
              className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 font-semibold transition-colors shrink-0"
            >
              +7 Días
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(15)}
              className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 font-semibold transition-colors shrink-0"
            >
              +15 Días
            </button>
          </div>

          {/* 3 COLUMNS SELECTOR GRID */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
            {/* COLUMN 1: DAY (DD) */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">
                Día (DD)
              </div>
              <div className="h-44 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                {Array.from({ length: maxDaysInMonth }, (_, i) => i + 1).map((d) => {
                  const isSelected = currentDay === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelectDay(d)}
                      className={`w-full py-1 text-xs font-bold rounded text-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white hover:bg-slate-200 text-slate-800 border border-slate-200/60"
                      }`}
                    >
                      {pad(d)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 2: MONTH (MM) */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">
                Mes (MM)
              </div>
              <div className="h-44 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                {MONTHS.map((m) => {
                  const isSelected = selectedMonth === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => handleSelectMonth(m.value)}
                      className={`w-full py-1 text-xs font-bold rounded text-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white hover:bg-slate-200 text-slate-800 border border-slate-200/60"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 3: YEAR (YYYY / YY) */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">
                Año (YY)
              </div>
              <div className="h-44 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                {yearsList.map((y) => {
                  const isSelected = selectedYear === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      className={`w-full py-1 text-xs font-bold rounded text-center transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white hover:bg-slate-200 text-slate-800 border border-slate-200/60"
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Confirm Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 font-mono">3 Columnas (DD/MM/YY)</span>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-7 px-3 gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Confirmar</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
