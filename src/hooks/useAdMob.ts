export const useAdMob = () => {
    const showInterstitial = () => {
        console.log("⚡ Iniciando protocolo de anuncio...");

        // 1. Intentar API JavaScript (La más limpia)
        // Usamos (window as any) para evitar errores de TypeScript
        if ((window as any).median?.admob) {
            console.log("✅ API Median JS detectada.");
            (window as any).median.admob.showInterstitial();
            return;
        }
        if ((window as any).gonative?.admob) {
            console.log("✅ API Gonative JS detectada.");
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