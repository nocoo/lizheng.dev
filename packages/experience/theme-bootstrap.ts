import { themeColors } from "./theme-colors";

export const themeScript = `(()=>{let p;try{p=localStorage.getItem('zl-theme')}catch{}if(p!=='light'&&p!=='dark')p='system';const t=p==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):p;document.documentElement.dataset.theme=t;document.documentElement.dataset.themePreference=p;document.documentElement.style.colorScheme=t;for(const m of document.querySelectorAll('meta[name="theme-color"]'))m.content=t==='dark'?'${themeColors.dark}':'${themeColors.light}'})()`;
