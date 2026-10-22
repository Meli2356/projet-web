
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Mampifandray amin’ny Django...')
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
 fetch("https://projet-web-backend-xp4w.onrender.com/api/")
      .then((response) => {
        if (!response.ok) {
          throw new Error('Tsy nahazo valiny avy amin’ny Django')
        }
        return response.json()
      })
      .then((data) => {
        setMessage(data.message)
      })
      .catch(() => {
        setMessage('Tsy afaka mifandray amin’ny Django API.')
        setErreur(true)
      })
  }, [])

  return (
    <main className="app">
      <div className="card">
        <h1>Mon application Django + React</h1>
        <p className={erreur ? 'error' : 'success'}>
          {message}
        </p>
        <span>Frontend : React</span>
        <span>Backend : Django REST Framework</span>
      </div>
    </main>
  )
}

export default App
