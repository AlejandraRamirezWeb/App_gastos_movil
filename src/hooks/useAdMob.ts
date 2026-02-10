export const useAdMob = () => {
    const showInterstitial = () => {
        console.log("⚡ Iniciando protocolo de anuncio...");

        try {
            // 1. Intentar API Median (Nueva denominación)
            const median = (window as any).median;
            if (median?.admob) {
                console.log("✅ API Median AdMob detectada.");
                if (typeof median.admob.showInterstitialIfReady === 'function') {
                    median.admob.showInterstitialIfReady();
                    return;
                } else if (typeof median.admob.showInterstitial === 'function') {
                    median.admob.showInterstitial();
                    return;
                }
            }

            // 2. Intentar API Gonative (Legacy)
            const gonative = (window as any).gonative;
            if (gonative?.admob) {
                console.log("✅ API Gonative AdMob detectada.");
                if (typeof gonative.admob.showInterstitial === 'function') {
                    gonative.admob.showInterstitial();
                    return;
                }
            }

            // 3. Fallback: Esquemas de URL nativos
            console.log("⚠️ APIs JS no encontradas o incompatibles. Intentando esquemas nativos...");
            window.location.href = "median://admob/interstitial/show";

            setTimeout(() => {
                // Si el esquema median:// no funcionó, intentamos gonative://
                if (window.location.href !== "median://admob/interstitial/show") return;
                window.location.href = "gonative://admob/interstitial/show";
            }, 500);

        } catch (error) {
            console.error("❌ Error al intentar mostrar el anuncio:", error);
        }
    };

    return { showInterstitial };
};