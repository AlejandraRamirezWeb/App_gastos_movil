export const useAdMob = () => {
    const showInterstitial = () => {
        // Detectamos si estamos en la App (Median/GoNative)
        const isMobileApp =
            (window as any).gonative ||
            navigator.userAgent.includes('median') ||
            navigator.userAgent.includes('gonative');

        if (isMobileApp) {
            console.log("📱 Ejecutando comando AdMob...");
            // Pequeño retraso para asegurar que la UI no bloquee la petición
            setTimeout(() => {
                window.location.href = "gonative://admob/interstitial/show";
            }, 100);
        } else {
            console.log("💻 Modo Web: El anuncio no saldrá aquí.");
        }
    };

    return { showInterstitial };
};