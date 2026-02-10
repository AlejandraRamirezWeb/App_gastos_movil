export const useAdMob = () => {
    const showInterstitial = () => {
        console.log("⚡ Intentando disparar anuncio...");

        // 1. API Moderna (Median)
        // Usamos (window as any) para que TypeScript no se queje
        if ((window as any).median?.admob) {
            console.log("✅ API Median detectada. Ejecutando showInterstitial...");
            (window as any).median.admob.showInterstitial();
            return;
        }

        // 2. API Legacy (Gonative)
        if ((window as any).gonative?.admob) {
            console.log("✅ API Gonative detectada. Ejecutando showInterstitial...");
            (window as any).gonative.admob.showInterstitial();
            return;
        }

        // 3. FALLBACK: Navegación Nativa (Si las APIs fallan)
        // Cambiar la URL es la forma más fiable de forzar al celular a procesar el comando
        console.log("⚠️ APIs JS no encontradas. Forzando comando nativo...");
        window.location.href = "gonative://admob/interstitial/show";
    };

    return { showInterstitial };
};