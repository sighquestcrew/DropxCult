"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
    data: any[];
    filename: string;
    columns: { key: string; header: string }[];
}

export default function ExportButton({ data, filename, columns }: ExportButtonProps) {
    const exportToCSV = () => {
        if (!data || data.length === 0) return;

        // Create CSV header
        const headers = columns.map((col) => col.header).join(",");

        // Create CSV rows
        const rows = data.map((item) => {
            return columns.map((col) => {
                let value = getNestedValue(item, col.key);

                // Handle special cases
                if (value === null || value === undefined) {
                    value = "";
                } else if (typeof value === "object") {
                    value = JSON.stringify(value);
                }

                // Escape quotes and wrap in quotes if contains comma
                value = String(value).replace(/"/g, '""');
                if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                    value = `"${value}"`;
                }

                return value;
            }).join(",");
        });

        // Combine headers and rows
        const csv = [headers, ...rows].join("\n");

        // Create download link
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={exportToCSV}
            disabled={!data || data.length === 0}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Download size={18} />
            Export CSV
        </button>
    );
}

// Helper function to get nested values like "user.email"
function getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}
