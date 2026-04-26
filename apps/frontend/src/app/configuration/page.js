'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfigurationPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/configuration/itemtype-preset');
    }, [router]);

    return null;
}