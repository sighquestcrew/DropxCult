"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import AuthGuard from "./AuthGuard";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <AuthGuard>
                    {children}
                </AuthGuard>
                <Toaster position="top-right" richColors />
            </QueryClientProvider>
        </Provider>
    );
}

