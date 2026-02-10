export const useAdMob = () => {
    const showInterstitial = () => {
        console.log("⚡ Intentando disparar anuncio...");

        // 1. API Moderna (Median)
        // Usamos (window as any) para que TypeScript no se queje
        const medianAdmob = (window as any).median?.admob;
        if (medianAdmob) {
            if (typeof medianAdmob.showInterstitial === "function") {
                console.log("✅ API Median detectada. Ejecutando showInterstitial...");
                medianAdmob.showInterstitial();
                return;
            }

            if (typeof medianAdmob?.interstitial?.show === "function") {
                console.log("✅ API Median detectada. Ejecutando interstitial.show...");
                medianAdmob.interstitial.show();
                return;
            }

            console.log("⚠️ API Median detectada pero sin método soportado. Usando fallback...");
        }

        // 2. API Legacy (Gonative)
        const gonativeAdmob = (window as any).gonative?.admob;
        if (gonativeAdmob) {
            if (typeof gonativeAdmob.showInterstitial === "function") {
                console.log("✅ API Gonative detectada. Ejecutando showInterstitial...");
                gonativeAdmob.showInterstitial();
                return;
            }

            if (typeof gonativeAdmob?.interstitial?.show === "function") {
                console.log("✅ API Gonative detectada. Ejecutando interstitial.show...");
                gonativeAdmob.interstitial.show();
                return;
            }

            console.log("⚠️ API Gonative detectada pero sin método soportado. Usando fallback...");
        }

        // 3. FALLBACK: Navegación Nativa (Si las APIs fallan)
        // Cambiar la URL es la forma más fiable de forzar al celular a procesar el comando
        console.log("⚠️ APIs JS no encontradas. Forzando comando nativo...");
        window.location.href = "gonative://admob/interstitial/show";
    };

    return { showInterstitial };
};
