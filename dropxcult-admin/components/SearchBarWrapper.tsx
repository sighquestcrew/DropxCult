"use client";

import dynamic from "next/dynamic";

const SearchBar = dynamic(() => import("@/components/SearchBar"), {
    ssr: false,
    loading: () => (
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-10 py-2.5 h-[42px] animate-pulse" />
    )
});

export default function SearchBarWrapper() {
    return <SearchBar />;
}
