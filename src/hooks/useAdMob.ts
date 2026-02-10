export const useAdMob = () => {
    const showInterstitial = () => {
        console.log("⚡ Iniciando protocolo de anuncio (Cada acción)...");

        // 1. Intentar API JavaScript Moderna (Median)
        if ((window as any).median?.admob) {
            console.log("✅ API Median JS detectada.");
            (window as any).median.admob.showInterstitial();
            return;
        }

        // 2. Intentar API Legacy (Gonative)
        if ((window as any).gonative?.admob) {
            console.log("✅ API Gonative JS detectada.");
            (window as any).gonative.admob.showInterstitial();
            return;
        }

        // 3. Fallback: Forzar navegación nativa
        console.log("⚠️ APIs JS no encontradas. Forzando esquema nativo...");
        window.location.href = "median://admob/interstitial/show";

        setTimeout(() => {
            window.location.href = "gonative://admob/interstitial/show";
        }, 500);
    };

    return { showInterstitial };
};