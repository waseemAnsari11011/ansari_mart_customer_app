import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Refresh account and offers when returning to Home or resuming the app.
export default function useHomeRefresh(refresh) {
    const refreshRef = useRef(refresh);
    refreshRef.current = refresh;
    useFocusEffect(useCallback(() => {
        let refreshing = false;
        const run = async () => {
            if (refreshing) { return; }
            refreshing = true;
            try { await refreshRef.current(); } finally { refreshing = false; }
        };
        run();
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') { run(); }
        });
        return () => subscription.remove();
    }, []));
}
