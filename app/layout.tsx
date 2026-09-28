import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Penalty Duel — Five shots. One winner.',description:'Challenge a friend to a 3D penalty shootout. Take turns shooting and saving, join by room code, and win the best-of-five duel.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#0a101b'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
