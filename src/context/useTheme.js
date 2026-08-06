import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

// Hook personalizado para consumir el tema fácilmente
export const useTheme = () => useContext(ThemeContext);
