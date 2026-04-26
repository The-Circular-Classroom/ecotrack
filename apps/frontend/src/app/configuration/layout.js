"use client";

import { usePathname } from 'next/navigation';
import { createContext, useContext, useState } from 'react';

// components
import ConfigSideNav from "@/components/configuration/ConfigSideNav";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const LayoutLoadingContext = createContext({ loading: true, setLoading: () => { } });
export const useLayoutLoading = () => useContext(LayoutLoadingContext);

export default function ConfigurationLayout({ children }) {
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    return (
        <LayoutLoadingContext.Provider value={{ loading, setLoading }}>
            <div className="mx-9 relative">
                <div className="flex flex-col lg:flex-row py-4 sm:py-6 lg:py-10 mx-auto gap-8">
                    {/* Side Navigation - hidden while loading */}
                    <div className={`bg-white shadow-md rounded-lg p-4 w-full lg:w-52 lg:min-w-52 lg:shrink-0 h-fit lg:sticky lg:top-6 transition-opacity duration-200 ${loading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <ConfigSideNav currentPath={pathname} />
                    </div>

                    {/* Main Content */}
                    <div className="w-full lg:flex-1 min-w-0 h-fit">
                        <div className={loading ? 'invisible' : 'visible'}>
                            {children}
                        </div>
                    </div>
                </div>

                {/* Full-area centered loading overlay */}
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ minHeight: '60vh', top: '-30%' }}>
                        <LoadingSpinner message="Loading configurations..." />
                    </div>
                )}
            </div>
        </LayoutLoadingContext.Provider>
    );
}