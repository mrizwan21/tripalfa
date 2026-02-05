export const toast = {
    success: (message: string) => {
        console.log('TOAST SUCCESS:', message);
        // In a real app, this would trigger a UI notification
    },
    error: (message: string) => {
        console.error('TOAST ERROR:', message);
        // In a real app, this would trigger a UI notification
    },
    info: (message: string) => {
        console.log('TOAST INFO:', message);
    }
};
