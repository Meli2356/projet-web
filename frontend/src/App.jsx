import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import './App.css'

const API_BASE = 'https://projet-web-backend-xp4w.onrender.com/api'

const menus = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '▦' },
  { id: 'produits', label: 'Produits & Stocks', icon: '▣' },
  { id: 'clients', label: 'Clients', icon: '♙' },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: '♧' },
  { id: 'achats', label: 'Achats', icon: '↓' },
  { id: 'ventes', label: 'Ventes', icon: '↑' },
]

const pages = {
  produits: { title: 'Produits & Stocks', endpoint: 'produits/' },
  clients: { title: 'Clients', endpoint: 'clients/' },
  fournisseurs: { title: 'Fournisseurs', endpoint: 'fournisseurs/' },
  achats: { title: 'Achats', endpoint: 'achats/' },
  ventes: { title: 'Ventes', endpoint: 'ventes/' },
}

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString('fr-FR')} Ar`

function App() {
  const [page, setPage] = useState('dashboard')
  const [data, setData] = useState({})
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [menuMobile, setMenuMobile] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState('')
  const [formProduit, setFormProduit] = useState({
    reference: '',
    nom: '',
    description: '',
    categorie: '',
    quantite: 0,
    prix_achat: '',
    prix_vente: '',
    seuil_alerte: 5,
  })

  async function chargerDonnees(pageId) {
    const config = pages[pageId]
    if (!config) return

    setChargement(true)
    setErreur('')

    try {
      const response = await fetch(`${API_BASE}/${config.endpoint}`)

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`)
      }

      const result = await response.json()
      setData((previous) => ({
        ...previous,
        [pageId]: Array.isArray(result) ? result : result.results || [],
      }))
    } catch (error) {
      setErreur(
        `Tsy afaka naka ny données ${config.title}. Hamarino ny connexion API. ${error.message}`
      )
    } finally {
      setChargement(false)
    }
  }


useEffect(() => {
  async function chargerToutesLesDonnees() {
    setErreur('')

    const resultats = await Promise.allSettled(
      Object.entries(pages).map(async ([pageId, config]) => {
        const response = await fetch(
          `${API_BASE}/${config.endpoint}`
        )

        if (!response.ok) {
          throw new Error(
            `${config.title}: HTTP ${response.status}`
          )
        }

        const result = await response.json()

        return [
          pageId,
          Array.isArray(result)
            ? result
            : result.results || [],
        ]
      })
    )

    const donneesRecues = {}
    const erreurs = []

    resultats.forEach((resultat) => {
      if (resultat.status === 'fulfilled') {
        const [pageId, lignes] = resultat.value
        donneesRecues[pageId] = lignes
      } else {
        erreurs.push(resultat.reason.message)
      }
    })

    setData((previous) => ({
      ...previous,
      ...donneesRecues,
    }))

    if (erreurs.length > 0) {
      setErreur(
        `Tsy tafiditra daholo ny données: ${erreurs.join(' ; ')}`
      )
    }
  }

  chargerToutesLesDonnees()
}, [])

useEffect(() => {
  if (page !== 'dashboard') {
    chargerDonnees(page)
  }
}, [page])

const produits = data.produits || []
const clients = data.clients || []
const fournisseurs = data.fournisseurs || []
const achats = data.achats || []
const ventes = data.ventes || []

// Données du graphique des ventes et des achats
const donneesTransactions = (() => {
  const parDate = {}

  ventes.forEach((vente) => {
    const date = String(vente.date_vente || '').slice(0, 10)
    if (!date) return

    if (!parDate[date]) {
      parDate[date] = { date, ventes: 0, achats: 0 }
    }

    parDate[date].ventes += Number(vente.montant_total || 0)
  })

  achats.forEach((achat) => {
    const date = String(achat.date_achat || '').slice(0, 10)
    if (!date) return

    if (!parDate[date]) {
      parDate[date] = { date, ventes: 0, achats: 0 }
    }

    parDate[date].achats += Number(achat.montant_total || 0)
  })

  return Object.values(parDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
})()

// Données du graphique des quantités en stock
const donneesStock = [...produits]
  .sort((a, b) => Number(b.quantite || 0) - Number(a.quantite || 0))
  .slice(0, 8)
  .map((produit) => ({
    nom: produit.nom || produit.reference || 'Produit',
    quantite: Number(produit.quantite || 0),
  }))



  const stockFaible = produits.filter(
    (produit) => Number(produit.quantite) <= Number(produit.seuil_alerte)
  )

  const valeurStock = produits.reduce(
    (total, produit) =>
      total + Number(produit.quantite) * Number(produit.prix_achat),
    0
  )

  function changerPage(id) {
    setPage(id)
    setMenuMobile(false)
    setErreur('')
    setMessage('')
    setRecherche('')
    setFormulaireOuvert(false)
  }

  async function ajouterProduit(e) {
    e.preventDefault()
    setEnregistrement(true)
    setMessage('')
    setErreur('')

    try {
      const response = await fetch(`${API_BASE}/produits/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formProduit,
          quantite: Number(formProduit.quantite),
          prix_achat: Number(formProduit.prix_achat),
          prix_vente: Number(formProduit.prix_vente),
          seuil_alerte: Number(formProduit.seuil_alerte),
        }),
      })

      const resultat = await response.json()
      if (!response.ok) {
        const details = Object.entries(resultat)
          .map(([champ, erreurs]) =>
            `${champ}: ${Array.isArray(erreurs) ? erreurs.join(', ') : erreurs}`
          )
          .join(' | ')
        throw new Error(details || 'Impossible d’ajouter le produit.')
      }

      setFormProduit({
        reference: '',
        nom: '',
        description: '',
        categorie: '',
        quantite: 0,
        prix_achat: '',
        prix_vente: '',
        seuil_alerte: 5,
      })
      setFormulaireOuvert(false)
      setMessage('Produit ajouté avec succès !')
      setRecherche('')
      await chargerDonnees('produits')
    } catch (error) {
      setErreur(error.message)
    } finally {
      setEnregistrement(false)
    }
  }

  function afficherTableau() {
    const toutesLesLignes = data[page] || []
    const rows = page === 'produits'
      ? toutesLesLignes.filter((produit) => {
          const terme = recherche.toLowerCase().trim()
          return (
            produit.reference?.toLowerCase().includes(terme) ||
            produit.nom?.toLowerCase().includes(terme) ||
            produit.categorie?.toLowerCase().includes(terme)
          )
        })
      : toutesLesLignes

    if (page === 'produits') {
      return (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Quantité</th>
                <th>Prix d'achat</th>
                <th>Prix de vente</th>
                <th>État du stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.reference}</strong></td>
                  <td>{item.nom}</td>
                  <td>{item.categorie || '—'}</td>
                  <td>{item.quantite}</td>
                  <td>{formatMoney(item.prix_achat)}</td>
                  <td>{formatMoney(item.prix_vente)}</td>
                  <td>
                    <span
                      className={
                        Number(item.quantite) <= Number(item.seuil_alerte)
                          ? 'status status-warning'
                          : 'status status-success'
                      }
                    >
                      {Number(item.quantite) <= Number(item.seuil_alerte)
                        ? 'Stock faible'
                        : 'Disponible'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (page === 'clients' || page === 'fournisseurs') {
      return (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Adresse</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.nom}</strong></td>
                  <td>{item.telephone || '—'}</td>
                  <td>{item.email || '—'}</td>
                  <td>{item.adresse || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (page === 'achats' || page === 'ventes') {
      const isAchat = page === 'achats'

      return (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>{isAchat ? 'Fournisseur' : 'Client'}</th>
                <th>Date</th>
                <th>Montant total</th>
                <th>Statut</th>
                <th>Lignes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td><strong>#{item.id}</strong></td>
                  <td>
                    {isAchat
                      ? item.fournisseur
                      : item.client ?? 'Client comptant'}
                  </td>
                  <td>
                    {new Date(
                      isAchat ? item.date_achat : item.date_vente
                    ).toLocaleDateString('fr-FR')}
                  </td>
                  <td>{formatMoney(item.montant_total)}</td>
                  <td>
                    <span className="status status-neutral">
                      {item.statut}
                    </span>
                  </td>
                  <td>{item.lignes?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    return null
  }

  return (
    <div className="layout">
      {menuMobile && (
        <button
          className="mobile-overlay"
          aria-label="Fermer le menu"
          onClick={() => setMenuMobile(false)}
        />
      )}

      <aside className={`sidebar ${menuMobile ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">G</div>
          <div>
            <h2>GestCom</h2>
            <span>Gestion commerciale</span>
          </div>
        </div>

        <p className="menu-caption">MENU PRINCIPAL</p>

        <nav className="navigation">
          {menus.map((menu) => (
            <button
              key={menu.id}
              className={`nav-item ${page === menu.id ? 'nav-active' : ''}`}
              onClick={() => changerPage(menu.id)}
            >
              <span className="nav-icon">{menu.icon}</span>
              <span>{menu.label}</span>
              {page === menu.id && <span className="active-marker" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">i</span>
            <div>
              <strong>Besoin d'aide ?</strong>
              <p>Gestion de votre activité</p>
            </div>
          </div>
          <p className="version">GestCom · Version 1.0</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMenuMobile(true)}
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>

          <div className="breadcrumb">
            Application <span>/</span>{' '}
            {menus.find((item) => item.id === page)?.label}
          </div>

          <div className="user-area">
            <div className="user-avatar">A</div>
            <div className="user-details">
              <strong>Administrateur</strong>
              <span>Gestion commerciale</span>
            </div>
          </div>
        </header>

        <div className="content">
          {page === 'dashboard' ? (
            <>
              <section className="page-heading">
                <div>
                  <p className="eyebrow">VOTRE ACTIVITÉ</p>
                  <h1>Tableau de bord</h1>
                  <p className="subtitle">
                    Bienvenue dans votre espace de gestion commerciale.
                  </p>
                </div>
                <button
                  className="button-primary"
                  onClick={() => changerPage('produits')}
                >
                  + Voir les produits
                </button>
              </section>

              {erreur && <p className="error-message">{erreur}</p>}

              <section className="stats-grid">
                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-purple">▣</span>
                    <span className="stat-label">Catalogue</span>
                  </div>
                  <strong className="stat-number">{produits.length}</strong>
                  <span className="stat-description">Produits enregistrés</span>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-blue">♙</span>
                    <span className="stat-label">Clients</span>
                  </div>
                  <strong className="stat-number">{clients.length}</strong>
                  <span className="stat-description">Clients chargés</span>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-orange">↓</span>
                    <span className="stat-label">Fournisseurs</span>
                  </div>
                  <strong className="stat-number">{fournisseurs.length}</strong>
                  <span className="stat-description">Fournisseurs chargés</span>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-green">▤</span>
                    <span className="stat-label">Valeur du stock</span>
                  </div>
                  <strong className="stat-number stat-money">
                    {formatMoney(valeurStock)}
                  </strong>
                  <span className="stat-description">Valeur au prix d'achat</span>
                </article>
              </section>

              <section className="dashboard-grid">
                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Produits récents</h2>
                      <p>Les derniers produits enregistrés</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => changerPage('produits')}
                    >
                      Voir tout →
                    </button>
                  </div>

                  {produits.length === 0 ? (
                    <p className="empty-state">Aucun produit à afficher.</p>
                  ) : (
                    <div className="recent-list">
                      {produits.slice(0, 5).map((item) => (
                        <div className="recent-item" key={item.id}>
                          <div className="product-avatar">▣</div>
                          <div className="recent-product">
                            <strong>{item.nom}</strong>
                            <span>{item.reference}</span>
                          </div>
                          <div className="recent-stock">
                            <strong>{item.quantite}</strong>
                            <span>unités</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>

                <article className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Alertes de stock</h2>
                      <p>Produits à réapprovisionner</p>
                    </div>
                    <span className="alert-count">{stockFaible.length}</span>
                  </div>

                  {stockFaible.length === 0 ? (
                    <div className="empty-state">
                      <span className="success-symbol">✓</span>
                      <p>Aucune alerte de stock.</p>
                    </div>
                  ) : (
                    <div className="alert-list">
                      {stockFaible.slice(0, 5).map((item) => (
                        <div className="alert-item" key={item.id}>
                          <div>
                            <strong>{item.nom}</strong>
                            <span>Seuil : {item.seuil_alerte}</span>
                          </div>
                          <span className="status status-warning">
                            Stock : {item.quantite}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    className="button-secondary full-width"
                    onClick={() => changerPage('produits')}
                  >
                    Consulter les stocks
                  </button>
                </article>
              </section>


              <section className="charts-grid">
                <div className="panel chart-panel">
                  <h2>Ventes et achats</h2>
                  <p className="chart-description">
                    Comparaison des montants par date (Ar)
                  </p>

                  {donneesTransactions.length > 0 ? (
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={donneesTransactions}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) =>
                              `${Number(value).toLocaleString('fr-FR')} Ar`
                            }
                          />
                          <Legend />
                          <Bar
                            dataKey="ventes"
                            name="Ventes"
                            fill="#2563eb"
                          />
                          <Bar
                            dataKey="achats"
                            name="Achats"
                            fill="#f59e0b"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p>Aucune donnée de vente ou d'achat disponible.</p>
                  )}
                </div>

                <div className="panel chart-panel">
                  <h2>Quantités en stock</h2>
                  <p className="chart-description">
                    Quantité disponible par produit
                  </p>

                  {donneesStock.length > 0 ? (
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={donneesStock}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="nom"
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="quantite"
                            name="Quantité en stock"
                            fill="#16a34a"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                                   ) : (
                    <p>Aucun produit disponible.</p>
                  )}
                </div>
              </section>

              <section className="panel quick-actions">
                <div className="panel-heading">
                  <div>
                    <h2>Accès rapide</h2>
                    <p>Accédez aux différents modules</p>
                  </div>
                </div>
                <div className="quick-grid">
                  {menus.slice(1).map((menu) => (
                    <button
                      key={menu.id}
                      className="quick-action"
                      onClick={() => changerPage(menu.id)}
                    >
                      <span className="quick-icon">{menu.icon}</span>
                      <span>{menu.label}</span>
                      <span className="quick-arrow">→</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="page-heading">
                <div>
                  <p className="eyebrow">GESTION DES DONNÉES</p>
                  <h1>{pages[page].title}</h1>
                  <p className="subtitle">
                    Consultez les informations enregistrées dans votre système.
                  </p>
                </div>
                <div className="page-actions">
                  {page === 'produits' && (
                    <button
                      className="button-primary"
                      onClick={() => {
                        setMessage('')
                        setErreur('')
                        setFormulaireOuvert(!formulaireOuvert)
                      }}
                    >
                      + Nouveau produit
                    </button>
                  )}
                  <button
                    className="button-secondary"
                    onClick={() => chargerDonnees(page)}
                    disabled={chargement}
                  >
                    ↻ Actualiser
                  </button>
                </div>
              </section>

              <section className="panel data-panel">
                {page === 'produits' && (
                  <div className="product-tools">
                    <input
                      type="search"
                      className="search-input"
                      placeholder="Rechercher par référence, nom ou catégorie..."
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      aria-label="Rechercher un produit"
                    />
                  </div>
                )}

                {message && <p className="success-message">{message}</p>}
                {formulaireOuvert && page === 'produits' && (
                  <form className="product-form" onSubmit={ajouterProduit}>
                    <h2>Nouveau produit</h2>
                    <div className="form-grid">
                      <label>
                        Référence *
                        <input required maxLength={50} value={formProduit.reference}
                          onChange={(e) => setFormProduit({ ...formProduit, reference: e.target.value })}
                          placeholder="Ex. PR002" />
                      </label>
                      <label>
                        Nom du produit *
                        <input required maxLength={150} value={formProduit.nom}
                          onChange={(e) => setFormProduit({ ...formProduit, nom: e.target.value })}
                          placeholder="Ex. Souris USB" />
                      </label>
                      <label>
                        Catégorie
                        <input maxLength={100} value={formProduit.categorie}
                          onChange={(e) => setFormProduit({ ...formProduit, categorie: e.target.value })}
                          placeholder="Ex. Informatique" />
                      </label>
                      <label>
                        Quantité initiale *
                        <input type="number" min="0" required value={formProduit.quantite}
                          onChange={(e) => setFormProduit({ ...formProduit, quantite: e.target.value })} />
                      </label>
                      <label>
                        Prix d'achat (Ar) *
                        <input type="number" min="0" step="0.01" required value={formProduit.prix_achat}
                          onChange={(e) => setFormProduit({ ...formProduit, prix_achat: e.target.value })} />
                      </label>
                      <label>
                        Prix de vente (Ar) *
                        <input type="number" min="0" step="0.01" required value={formProduit.prix_vente}
                          onChange={(e) => setFormProduit({ ...formProduit, prix_vente: e.target.value })} />
                      </label>
                      <label>
                        Seuil d'alerte
                        <input type="number" min="0" value={formProduit.seuil_alerte}
                          onChange={(e) => setFormProduit({ ...formProduit, seuil_alerte: e.target.value })} />
                      </label>
                      <label className="form-description">
                        Description
                        <textarea value={formProduit.description}
                          onChange={(e) => setFormProduit({ ...formProduit, description: e.target.value })}
                          placeholder="Description du produit..." />
                      </label>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="button-secondary"
                        onClick={() => setFormulaireOuvert(false)}>Annuler</button>
                      <button type="submit" className="button-primary" disabled={enregistrement}>
                        {enregistrement ? 'Enregistrement...' : 'Enregistrer le produit'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="panel-heading">
                  <div>
                    <h2>{pages[page].title}</h2>
                    <p>
                      {chargement
                        ? 'Chargement des données...'
                        : `${(data[page] || []).length} enregistrement(s)`}
                    </p>
                  </div>
                </div>

                {erreur && <p className="error-message">{erreur}</p>}

                {chargement ? (
                  <p className="empty-state">Chargement...</p>
                ) : (data[page] || []).length === 0 ? (
                  <p className="empty-state">
                    Aucune donnée disponible pour le moment.
                    <br />
                    Vous pouvez gérer ces informations depuis Django Admin.
                  </p>
                ) : (
                  afficherTableau()
                )}
              </section>
            </>
          )}

          <footer className="footer">
            <span>© {new Date().getFullYear()} GestCom</span>
            <span>Gestion commerciale & stocks</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
