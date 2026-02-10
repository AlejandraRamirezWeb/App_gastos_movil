export const useAdMob = () => {
    const showInterstitial = () => {
        console.log("⚡ Intentando disparar anuncio...");

        // 1. Intentar acceder al objeto global 'median' (API Moderna)
        // Usamos (window as any) para evitar el error de TypeScript
        if ((window as any).median?.admob) {
            console.log("✅ API Median detectada. Ejecutando showInterstitial...");
            (window as any).median.admob.showInterstitial();
            return;
        }

        // 2. Intentar acceder al objeto global 'gonative' (API Legacy)
        if ((window as any).gonative?.admob) {
            console.log("✅ API Gonative detectada. Ejecutando showInterstitial...");
            (window as any).gonative.admob.showInterstitial();
            return;
        }

        // 3. ENFOQUE NUEVO: Inyección de Iframe (Si las APIs fallan)
        // Esto fuerza al navegador del móvil a procesar el esquema URL
        console.log("⚠️ APIs no detectadas. Usando inyección de Iframe forzada...");
        const iframe = document.createElement("iframe");
        iframe.setAttribute("src", "gonative://admob/interstitial/show");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        // Limpiamos el iframe después de 1 segundo
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };

    return { showInterstitial };
};