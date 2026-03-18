/**
 * UITLEG VOOR DOCENT EN LEERLINGEN:
 * Dit is het absolute startpunt van de React code (main.jsx).
 * Hier 'plakken' we de inhoud van App.jsx in een virtueel element op de pagina (de root).
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
