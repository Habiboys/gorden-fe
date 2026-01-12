import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useConfirm } from '../context/ConfirmContext';

/**
 * Custom hook to block React Router navigation (v6.19+ Data Router)
 * Uses custom Confirm Dialog instead of window.confirm
 * @param message Message to display in the confirm dialog
 * @param when Boolean condition to enable blocking
 * @param onProceed Optional async callback to execute before proceeding (e.g. cleanup)
 */
export function useRouterBlocker(message: string, when: boolean, onProceed?: () => Promise<void>) {
    const { confirm } = useConfirm();

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === 'blocked') {
            // Use custom confirm dialog
            const showConfirm = async () => {
                const result = await confirm({
                    title: 'Konfirmasi Keluar',
                    description: message,
                    confirmText: 'Ya, Keluar',
                    cancelText: 'Batal',
                    variant: 'destructive',
                });

                if (result) {
                    if (onProceed) {
                        await onProceed();
                    }
                    if (blocker.state === 'blocked') {
                        blocker.proceed();
                    }
                } else {
                    if (blocker.state === 'blocked') {
                        blocker.reset();
                    }
                }
            };

            showConfirm();
        }
    }, [blocker, message, confirm, onProceed]);
}
