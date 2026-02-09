export const useAdMob = () => {
    const showInterstitial = () => {
        // Detectamos si estamos en la app móvil (Median/GoNative)
        const isMobileApp = navigator.userAgent.includes('median') ||
            navigator.userAgent.includes('gonative');

        if (isMobileApp) {
            console.log("Comando enviado: gonative://admob/interstitial/show");
            window.location.href = "gonative://admob/interstitial/show";
        } else {
            console.log("Simulación: Anuncio solicitado (Solo visible en APK)");
        }
    };

    return { showInterstitial };
};