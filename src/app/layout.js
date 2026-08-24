import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata = {
  title: 'HAGENPARTNER | 3D Glass Objects',
  description: 'Interaktive 3D-Glasobjekte für die Hagen Partner Website',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de" className={GeistMono.variable}>
      <body>{children}</body>
    </html>
  )
}
