import { useState } from 'react';

interface UseSubmitOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
}

export function useSubmit<T, P = any>(
    apiCall: (data: P) => Promise<T>,
    options: UseSubmitOptions<T> = {}
) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const submit = async (data: P) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiCall(data);
            if (options.successMessage) {
                // toast.success(options.successMessage);
                console.log(options.successMessage); // Placeholder
            }
            options.onSuccess?.(result);
            return result;
        } catch (err: any) {
            setError(err);
            options.onError?.(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { submit, loading, error };
}
