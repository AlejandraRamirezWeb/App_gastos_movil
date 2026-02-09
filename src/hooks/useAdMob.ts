export const useAdMob = () => {
    const showInterstitial = () => {
        // 1. Detectar si estamos en el entorno de la App (Median o GoNative)
        const isMobileApp =
            navigator.userAgent.includes('median') ||
            navigator.userAgent.includes('gonative') ||
            (window as any).gonative;

        if (isMobileApp) {
            console.log("Comando enviado: gonative://admob/interstitial/show");

            // Añadimos un pequeño retraso de 100ms para asegurar que 
            // la UI de React haya terminado de procesar el clic antes del anuncio.
            setTimeout(() => {
                window.location.href = "gonative://admob/interstitial/show";
            }, 100);

        } else {
            console.log("Entorno Web: El anuncio no se mostrará fuera del APK/IPA.");
        }
    };

    return { showInterstitial };
};
