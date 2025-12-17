import React, { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';

interface ConfirmOptions {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

interface ConfirmContextType {
    confirm: (options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

interface ConfirmProviderProps {
    children: ReactNode;
}

export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({});
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions = {}) => {
        setOptions({
            title: options.title || 'Konfirmasi',
            description: options.description || 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
            confirmText: options.confirmText || 'Ya, Lanjutkan',
            cancelText: options.cancelText || 'Batal',
            variant: options.variant || 'default',
        });
        setOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        if (resolvePromise) resolvePromise(true);
        setOpen(false);
    };

    const handleCancel = () => {
        if (resolvePromise) resolvePromise(false);
        setOpen(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-gray-900">
                            {options.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 text-base">
                            {options.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel
                            onClick={handleCancel}
                            className="rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 font-medium"
                        >
                            {options.cancelText}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={`rounded-xl font-medium text-white shadow-lg shadow-pink-500/20 ${options.variant === 'destructive'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-[#EB216A] hover:bg-[#d11d5e]'
                                }`}
                        >
                            {options.confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
};
