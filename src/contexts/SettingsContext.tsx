import React, { createContext, useContext, useState } from 'react';

export type CurrencyCode = 'COP' | 'AUD';

export const EXCHANGE_RATE = 2550; // 1 AUD = 2550 COP

interface SettingsContextType {
    currency: CurrencyCode;
    setCurrency: (currency: CurrencyCode) => void;
    convertToBase: (amount: number) => number;
    convertFromBase: (amount: number) => number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
        const saved = localStorage.getItem('app_currency');
        return (saved as CurrencyCode) || 'COP';
    });

    const setCurrency = (newCurrency: CurrencyCode) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('app_currency', newCurrency);
    };

    const convertToBase = (amount: number) => {
        return currency === 'AUD' ? amount * EXCHANGE_RATE : amount;
    };

    const convertFromBase = (amount: number) => {
        return currency === 'AUD' ? amount / EXCHANGE_RATE : amount;
    };

    return (
        <SettingsContext.Provider value={{ currency, setCurrency, convertToBase, convertFromBase }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
