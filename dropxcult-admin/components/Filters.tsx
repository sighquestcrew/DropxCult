"use client";

import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

interface SearchInputProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function SearchInput({ placeholder = "Search...", value, onChange, className = "" }: SearchInputProps) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [localValue, onChange]);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-10 py-2 text-white placeholder-gray-500 focus:border-red-600 focus:outline-none transition"
            />
            {localValue && (
                <button
                    onClick={() => {
                        setLocalValue("");
                        onChange("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
}

interface SelectFilterProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    className?: string;
}

export function SelectFilter({ label, value, options, onChange, className = "" }: SelectFilterProps) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label className="text-xs text-gray-500 uppercase font-bold">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white focus:border-red-600 focus:outline-none transition cursor-pointer"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

interface FilterTabsProps {
    tabs: { value: string; label: string; count?: number }[];
    activeTab: string;
    onTabChange: (value: string) => void;
}

export function FilterTabs({ tabs, activeTab, onTabChange }: FilterTabsProps) {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
                <button
                    key={tab.value}
                    onClick={() => onTabChange(tab.value)}
                    className={`px-4 py-2 rounded text-sm font-bold whitespace-nowrap transition ${activeTab === tab.value
                            ? "bg-red-600 text-white"
                            : "bg-zinc-900 text-gray-400 hover:bg-zinc-800 hover:text-white"
                        }`}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.value ? "bg-red-800" : "bg-zinc-800"
                            }`}>
                            {tab.count}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
}

export function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangePickerProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase font-bold">From</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white focus:border-red-600 focus:outline-none transition"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase font-bold">To</label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white focus:border-red-600 focus:outline-none transition"
                />
            </div>
        </div>
    );
}
