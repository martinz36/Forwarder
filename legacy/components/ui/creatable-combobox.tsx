"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface CreatableComboboxProps {
  value: string; // current text or option label/id
  onChange: (value: string, selectedOption?: ComboboxOption) => void;
  options: ComboboxOption[];
  placeholder?: string;
  createLabelPrefix?: string; // e.g. "Crear puerto"
  onCreate?: (inputValue: string) => Promise<ComboboxOption | null>;
  className?: string;
  disabled?: boolean;
}

export function CreatableCombobox({
  value,
  onChange,
  options,
  placeholder = "Seleccionar o buscar...",
  createLabelPrefix = "Crear",
  onCreate,
  className = "",
  disabled = false,
}: CreatableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  const hasExactMatch = options.some(
    (opt) => opt.label.trim().toLowerCase() === search.trim().toLowerCase()
  );

  const canCreate = !!onCreate && search.trim().length > 0 && !hasExactMatch;

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(option: ComboboxOption) {
    onChange(option.label, option);
    setSearch("");
    setIsOpen(false);
  }

  async function handleCreateNew() {
    if (!onCreate || !search.trim() || isCreating) return;
    try {
      setIsCreating(true);
      const newOpt = await onCreate(search.trim());
      if (newOpt) {
        onChange(newOpt.label, newOpt);
      } else {
        onChange(search.trim());
      }
      setSearch("");
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const totalItems = filteredOptions.length + (canCreate ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (canCreate && selectedIndex === filteredOptions.length) {
        handleCreateNew();
      } else if (filteredOptions[selectedIndex]) {
        handleSelect(filteredOptions[selectedIndex]);
      } else if (search.trim()) {
        onChange(search.trim());
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Display Input / Button */}
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          value={isOpen ? search : value}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            setSearch(value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="h-9 text-xs font-medium pr-8 bg-white border-slate-200 shadow-sm focus:border-blue-500"
        />

        {value && !isOpen ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setSearch("");
            }}
            className="absolute right-2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronsUpDown className="absolute right-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        )}
      </div>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg text-xs">
          {filteredOptions.length === 0 && !canCreate && (
            <div className="p-2.5 text-center text-slate-400 font-medium">
              No se encontraron resultados.
            </div>
          )}

          {filteredOptions.map((opt, idx) => {
            const isSelected = opt.label.trim().toLowerCase() === value.trim().toLowerCase();
            const isHighlighted = idx === selectedIndex;

            return (
              <div
                key={opt.id}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  isHighlighted ? "bg-blue-50 text-blue-900 font-bold" : "hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-[10px] text-slate-400 font-normal">{opt.sublabel}</span>
                  )}
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
              </div>
            );
          })}

          {canCreate && (
            <div
              onClick={handleCreateNew}
              onMouseEnter={() => setSelectedIndex(filteredOptions.length)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100 rounded-md cursor-pointer border-t border-blue-100 mt-1 transition-colors ${
                selectedIndex === filteredOptions.length ? "ring-1 ring-blue-400 bg-blue-100" : ""
              }`}
            >
              {isCreating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              ) : (
                <Plus className="h-3.5 w-3.5 text-blue-600" />
              )}
              <span>
                + {createLabelPrefix} &quot;<strong className="underline">{search.trim()}</strong>&quot;
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
