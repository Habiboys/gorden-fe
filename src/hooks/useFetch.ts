import { useCallback, useEffect, useState } from 'react';

interface UseFetchOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    immediate?: boolean;
}

export function useFetch<T>(
    apiCall: () => Promise<T>,
    options: UseFetchOptions = { immediate: true }
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(options.immediate ?? true);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiCall();
            setData(result);
            options.onSuccess?.(result);
        } catch (err: any) {
            setError(err);
            options.onError?.(err);
        } finally {
            setLoading(false);
        }
    }, [apiCall]); // Be careful with dependency array here, apiCall should be stable

    useEffect(() => {
        if (options.immediate) {
            execute();
        }
    }, [execute, options.immediate]);

    return { data, loading, error, refetch: execute };
}
