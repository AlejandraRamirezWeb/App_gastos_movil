export const useAdMob = () => {
    const showInterstitial = () => {
        console.log("⚡ Iniciando protocolo de anuncio...");

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

        // 2. Intentar Esquemas de URL (Fuerza Bruta)
        console.log("⚠️ APIs JS no encontradas. Probando esquemas nativos...");

        // Intenta primero el esquema moderno
        window.location.href = "median://admob/interstitial/show";

        // Si en 500ms no ha pasado nada, intenta el antiguo
        setTimeout(() => {
            console.log("🔄 Reintentando con esquema legacy...");
            window.location.href = "gonative://admob/interstitial/show";
        }, 500);
    };

    return { showInterstitial };
};
