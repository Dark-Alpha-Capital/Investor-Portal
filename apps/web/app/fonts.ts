import { Montserrat, Raleway, Fira_Code } from "next/font/google";

export const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap", // Prevent FOIT (Flash of Invisible Text)
});

export const raleway = Raleway({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const fira_code = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"], // Reduced weights for code - only need regular and bold
  display: "swap",
});
