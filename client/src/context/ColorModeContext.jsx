import React, { createContext, useState, useMemo, useContext } from 'react';

export const ColorModeContext = createContext({ toggleColorMode: () => { }, mode: 'light' });

export const useColorMode = () => useContext(ColorModeContext);

export const ColorModeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('mesob_theme_mode') || 'light';
    });

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => {
                    const nextMode = prevMode === 'light' ? 'dark' : 'light';
                    localStorage.setItem('mesob_theme_mode', nextMode);
                    return nextMode;
                });
            },
            mode,
        }),
        [mode]
    );

    return (
        <ColorModeContext.Provider value={colorMode}>
            {children}
        </ColorModeContext.Provider>
    );
};
