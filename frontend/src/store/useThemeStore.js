import {create} from "zustand";

export const useThemeStore=create((set,get)=>(
    {
        theme : localStorage.getItem("bubble-theme")||"coffee",
        setTheme : (theme)=>{
            localStorage.setItem("bubble-theme",theme);
            set({theme});
        },
    }
));

