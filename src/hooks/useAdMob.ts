// src/hooks/useAdMob.ts

// Extendemos la interfaz Window para que TypeScript no marque error con 'median'
declare global {
    interface Window {
        median?: any;
    }
}

export const useAdMob = () => {

    // Función para mostrar el anuncio intersticial
    const showInterstitial = () => {
        if (window.median) {
            // Si estamos dentro de la App generada por Median
            console.log("Intentando mostrar anuncio intersticial...");

            // Esta función verifica si el anuncio está precargado y lo muestra
            window.median.admob?.showInterstitialIfReady();
        } else {
            // Si estamos en el navegador web (pruebas locales)
            console.log("Simulación Web: Aquí se mostraría un anuncio Intersticial");
        }
    };

    return {
        showInterstitial
    };
};