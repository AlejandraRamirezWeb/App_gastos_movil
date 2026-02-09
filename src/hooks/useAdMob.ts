export const useAdMob = () => {
    const showInterstitial = () => {
        // 1. Detección agresiva: Busca el objeto gonative o el userAgent
        const isMobileApp =
            (window as any).gonative ||
            navigator.userAgent.includes('median') ||
            navigator.userAgent.includes('gonative');

        if (isMobileApp) {
            console.log("📱 Ejecutando comando AdMob...");

            // 2. Pequeño retraso para asegurar que React no bloquee el hilo
            setTimeout(() => {
                window.location.href = "gonative://admob/interstitial/show";
            }, 100);

        } else {
            console.log("💻 Modo Web: El anuncio no saldrá aquí (Solo en APK).");
        }
    };

    return { showInterstitial };
};