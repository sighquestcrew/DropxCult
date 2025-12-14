"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster position="top-right" richColors />
            </QueryClientProvider>
        </Provider>
    );
}
