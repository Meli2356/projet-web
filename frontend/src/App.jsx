
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'https://projet-web-backend-xp4w.onrender.com/api/produits/'

function App() {
  const [produits, setProduits] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Tsy afaka maka ny produits.')
        }
        return response.json()
      })
      .then((data) => {
        setProduits(data)
      })
      .catch(() => {
        setErreur('Tsy afaka mifandray amin’ny API. Andramo indray.')
      })
      .finally(() => {
        setChargement(false)
      })
  }, [])

  return (
    <main className="app">
      <header className="header">
        <h1>Gestion de stocks</h1>
        <p>Application de gestion des produits</p>
      </header>

      <section className="card">
        <h2>Liste des produits</h2>

        {chargement && <p>Chargement des produits...</p>}

        {erreur && <p className="error">{erreur}</p>}

        {!chargement && !erreur && (
          <>
            <p>Nombre de produits : {produits.length}</p>

            {produits.length === 0 ? (
              <p>Tsy mbola misy produit.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Quantité</th>
                      <th>Prix d'achat</th>
                      <th>Prix de vente</th>
                      <th>Stock</th>
                    </tr>
                  </thead>

                  <tbody>
                    {produits.map((produit) => (
                      <tr key={produit.id}>
                        <td>{produit.reference}</td>
                        <td>{produit.nom}</td>
                        <td>{produit.categorie || '-'}</td>
                        <td>{produit.quantite}</td>
                        <td>{Number(produit.prix_achat).toLocaleString('fr-FR')} Ar</td>
                        <td>{Number(produit.prix_vente).toLocaleString('fr-FR')} Ar</td>
                        <td>
                          {produit.quantite <= produit.seuil_alerte ? (
                            <span className="stock-alert">Stock faible</span>
                          ) : (
                            <span className="stock-ok">Disponible</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default App
