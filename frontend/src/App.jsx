import { useCallback, useEffect, useMemo, useState } from 'react'
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

const MENUS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '▦' },
  { id: 'produits', label: 'Produits & Stocks', icon: '▣' },
  { id: 'clients', label: 'Clients', icon: '♙' },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: '♧' },
  { id: 'achats', label: 'Achats', icon: '↓' },
  { id: 'ventes', label: 'Ventes', icon: '↑' },
]

const EMPTY_PRODUCT = {
  reference: '',
  nom: '',
  description: '',
  categorie: '',
  quantite: 0,
  prix_achat: 0,
  prix_vente: 0,
  seuil_alerte: 5,
}

const EMPTY_PERSON = {
  nom: '',
  telephone: '',
  email: '',
  adresse: '',
}

const money = (value) =>
  `${Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Ar`

const dateText = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (typeof data === 'string') throw new Error(data)
    if (data.detail) throw new Error(data.detail)
    if (data.erreur) throw new Error(data.erreur)

    const message = Object.entries(data)
      .map(([key, value]) => {
        const text = Array.isArray(value) ? value.join(', ') : String(value)
        return `${key}: ${text}`
      })
      .join(' · ')

    throw new Error(message || `Erreur HTTP ${response.status}`)
  }

  return data
}

function getError(error) {
  if (error instanceof TypeError) {
    return 'Connexion au serveur impossible. Vérifiez Internet et la disponibilité du backend Render.'
  }
  return error?.message || 'Une erreur est survenue.'
}

function StatusBadge({ value }) {
  const labels = {
    brouillon: 'Brouillon',
    valide: 'Validé',
    annule: 'Annulé',
  }

  return (
    <span className={`status status-${value || 'default'}`}>
      {labels[value] || value || '—'}
    </span>
  )
}

function EmptyState({ children = 'Aucune donnée disponible.' }) {
  return <div className="empty-state">{children}</div>
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="modal-card"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/connexion/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await readResponse(response)

      if (!data.token) throw new Error('Le serveur n’a pas retourné de token.')

      onLogin(data.token, username)
    } catch (err) {
      setError(getError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <span className="brand-logo">G</span>
          <div>
            <h1>GestCom</h1>
            <p>Gestion commerciale</p>
          </div>
        </div>

        <div>
          <p className="eyebrow">ESPACE DE GESTION</p>
          <h2>Bienvenue !</h2>
          <p className="login-subtitle">
            Connectez-vous pour accéder à votre espace.
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <label className="field">
          Nom d’utilisateur
          <input
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Votre nom d’utilisateur"
          />
        </label>

        <label className="field">
          Mot de passe
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Votre mot de passe"
          />
        </label>

        <button className="button-primary login-submit" disabled={busy}>
          {busy ? 'Connexion en cours…' : 'Se connecter →'}
        </button>

        <p className="login-note">
          Utilisez votre compte Django existant.
        </p>
      </form>
    </main>
  )
}

function ProductForm({ initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState({ ...EMPTY_PRODUCT, ...initial })
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }))

  function submit(event) {
    event.preventDefault()
    onSave({
      ...form,
      quantite: Number(form.quantite),
      prix_achat: Number(form.prix_achat),
      prix_vente: Number(form.prix_vente),
      seuil_alerte: Number(form.seuil_alerte),
    })
  }

  return (
    <form className="entity-form" onSubmit={submit}>
      <h2>{initial?.id ? 'Modifier le produit' : 'Nouveau produit'}</h2>
      <div className="form-grid">
        <label className="field">
          Référence *
          <input
            value={form.reference}
            onChange={(e) => set('reference', e.target.value)}
            required
          />
        </label>
        <label className="field">
          Nom du produit *
          <input
            value={form.nom}
            onChange={(e) => set('nom', e.target.value)}
            required
          />
        </label>
        <label className="field">
          Catégorie
          <input
            value={form.categorie}
            onChange={(e) => set('categorie', e.target.value)}
          />
        </label>
        <label className="field">
          Quantité en stock *
          <input
            type="number"
            min="0"
            step="1"
            value={form.quantite}
            onChange={(e) => set('quantite', e.target.value)}
            required
          />
        </label>
        <label className="field">
          Prix d’achat *
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.prix_achat}
            onChange={(e) => set('prix_achat', e.target.value)}
            required
          />
        </label>
        <label className="field">
          Prix de vente *
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.prix_vente}
            onChange={(e) => set('prix_vente', e.target.value)}
            required
          />
        </label>
        <label className="field">
          Seuil d’alerte
          <input
            type="number"
            min="0"
            step="1"
            value={form.seuil_alerte}
            onChange={(e) => set('seuil_alerte', e.target.value)}
          />
        </label>
        <label className="field form-description">
          Description
          <textarea
            rows="3"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button className="button-primary" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

function PersonForm({ initial, title, onSave, onCancel, busy }) {
  const [form, setForm] = useState({ ...EMPTY_PERSON, ...initial })

  function set(key, value) {
    setForm((old) => ({ ...old, [key]: value }))
  }

  function submit(event) {
    event.preventDefault()
    onSave(form)
  }

  return (
    <form className="entity-form" onSubmit={submit}>
      <h2>{title}</h2>
      <div className="form-grid">
        <label className="field">
          Nom *
          <input
            value={form.nom}
            onChange={(e) => set('nom', e.target.value)}
            required
          />
        </label>
        <label className="field">
          Téléphone
          <input
            type="tel"
            value={form.telephone}
            onChange={(e) => set('telephone', e.target.value)}
          />
        </label>
        <label className="field">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </label>
        <label className="field">
          Adresse
          <textarea
            rows="2"
            value={form.adresse}
            onChange={(e) => set('adresse', e.target.value)}
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button className="button-primary" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

function TransactionForm({
  type,
  products,
  people,
  onSave,
  onCancel,
  busy,
}) {
  const isSale = type === 'ventes'
  const personKey = isSale ? 'client' : 'fournisseur'
  const personLabel = isSale ? 'Client' : 'Fournisseur'
  const priceKey = isSale ? 'prix_vente' : 'prix_achat'

  const [person, setPerson] = useState('')
  const [lines, setLines] = useState([
    { produit: '', quantite: 1, prix_unitaire: '' },
  ])

  const total = lines.reduce(
    (sum, line) =>
      sum + Number(line.quantite || 0) * Number(line.prix_unitaire || 0),
    0,
  )

  function changeLine(index, key, value) {
    setLines((old) =>
      old.map((line, i) => {
        if (i !== index) return line

        if (key === 'produit') {
          const product = products.find((p) => String(p.id) === String(value))
          return {
            ...line,
            produit: value,
            prix_unitaire: product ? product[priceKey] : '',
          }
        }

        return { ...line, [key]: value }
      }),
    )
  }

  function submit(event) {
    event.preventDefault()

    const validLines = lines.map((line) => ({
      produit: Number(line.produit),
      quantite: Number(line.quantite),
      prix_unitaire: Number(line.prix_unitaire),
    }))

    if (!validLines.length || validLines.some(
      (line) =>
        !line.produit ||
        !Number.isInteger(line.quantite) ||
        line.quantite <= 0 ||
        !Number.isFinite(line.prix_unitaire) ||
        line.prix_unitaire < 0,
    )) {
      return
    }

    const payload = { lignes: validLines }
    if (person) payload[personKey] = Number(person)

    onSave(payload)
  }

  return (
    <form className="entity-form" onSubmit={submit}>
      <h2>Nouvel {isSale ? 'vente' : 'achat'}</h2>

      <label className="field">
        {personLabel} {isSale ? '(facultatif)' : '*'}
        <select
          value={person}
          required={!isSale}
          onChange={(e) => setPerson(e.target.value)}
        >
          <option value="">Sélectionner {personLabel.toLowerCase()}</option>
          {people.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nom}
            </option>
          ))}
        </select>
      </label>

      <div className="transaction-lines">
        <div className="line-heading">
          <h3>Produits</h3>
          <button
            type="button"
            className="button-secondary"
            onClick={() =>
              setLines((old) => [
                ...old,
                { produit: '', quantite: 1, prix_unitaire: '' },
              ])
            }
          >
            + Ajouter une ligne
          </button>
        </div>

        {lines.map((line, index) => (
          <div className="transaction-line" key={index}>
            <label className="field">
              Produit *
              <select
                value={line.produit}
                required
                onChange={(e) =>
                  changeLine(index, 'produit', e.target.value)
                }
              >
                <option value="">Sélectionner</option>
                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={
                      isSale &&
                      Number(product.quantite) <= 0 &&
                      String(product.id) !== String(line.produit)
                    }
                  >
                    {product.reference} — {product.nom}
                    {isSale ? ` (stock: ${product.quantite})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              Quantité *
              <input
                type="number"
                min="1"
                step="1"
                required
                value={line.quantite}
                onChange={(e) =>
                  changeLine(index, 'quantite', e.target.value)
                }
              />
            </label>

            <label className="field">
              Prix unitaire *
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={line.prix_unitaire}
                onChange={(e) =>
                  changeLine(index, 'prix_unitaire', e.target.value)
                }
              />
            </label>

            <button
              type="button"
              className="remove-line"
              title="Supprimer cette ligne"
              disabled={lines.length === 1}
              onClick={() =>
                setLines((old) => old.filter((_, i) => i !== index))
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="transaction-total">
        <span>Montant estimé</span>
        <strong>{money(total)}</strong>
      </div>

      <p className="form-help">
        L’opération sera créée en brouillon. Le stock changera uniquement
        après validation.
      </p>

      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button className="button-primary" disabled={busy || products.length === 0}>
          {busy ? 'Enregistrement…' : 'Créer le brouillon'}
        </button>
      </div>
    </form>
  )
}

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('gestcom_token') || '')
  const [username, setUsername] = useState(() => sessionStorage.getItem('gestcom_user') || '')
  const [active, setActive] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  const [produits, setProduits] = useState([])
  const [clients, setClients] = useState([])
  const [fournisseurs, setFournisseurs] = useState([])
  const [achats, setAchats] = useState([])
  const [ventes, setVentes] = useState([])

  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const request = useCallback(async (endpoint, options = {}) => {
    const headers = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers,
    })
    return readResponse(response)
  }, [token])

  const loadData = useCallback(async (section = active) => {
    if (!token) return
    setLoading(true)
    setError('')

    try {
      const [p, c, f] = await Promise.all([
        request('produits/'),
        request('clients/'),
        request('fournisseurs/'),
      ])

      setProduits(Array.isArray(p) ? p : p.results || [])
      setClients(Array.isArray(c) ? c : c.results || [])
      setFournisseurs(Array.isArray(f) ? f : f.results || [])

      if (section === 'achats' || section === 'dashboard') {
        const data = await request('achats/')
        setAchats(Array.isArray(data) ? data : data.results || [])
      }

      if (section === 'ventes' || section === 'dashboard') {
        const data = await request('ventes/')
        setVentes(Array.isArray(data) ? data : data.results || [])
      }
    } catch (err) {
      setError(getError(err))
    } finally {
      setLoading(false)
    }
  }, [token, active, request])

  useEffect(() => {
    if (token) loadData(active)
  }, [token, active, loadData])

  function login(newToken, newUsername) {
    sessionStorage.setItem('gestcom_token', newToken)
    sessionStorage.setItem('gestcom_user', newUsername)
    setToken(newToken)
    setUsername(newUsername)
    setActive('dashboard')
    setNotice('Connexion réussie.')
  }

  function logout() {
    sessionStorage.removeItem('gestcom_token')
    sessionStorage.removeItem('gestcom_user')
    setToken('')
    setUsername('')
    setProduits([])
    setClients([])
    setFournisseurs([])
    setAchats([])
    setVentes([])
    setError('')
    setNotice('')
  }

  function openCreate() {
    setEditing(null)
    setShowForm(true)
    setError('')
    setNotice('')
  }

  function openEdit(item) {
    setEditing(item)
    setShowForm(true)
    setError('')
    setNotice('')
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  async function saveEntity(endpoint, payload, id = null) {
    setBusy(true)
    setError('')
    setNotice('')

    try {
      await request(`${endpoint}${id ? `${id}/` : ''}`, {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      })
      closeForm()
      setNotice('Enregistrement effectué.')
      await loadData(active)
    } catch (err) {
      setError(getError(err))
    } finally {
      setBusy(false)
    }
  }

  async function deleteEntity(endpoint, item, label) {
    if (!window.confirm(`Voulez-vous vraiment supprimer ${label} ?`)) return

    setBusy(true)
    setError('')
    setNotice('')

    try {
      await request(`${endpoint}${item.id}/`, { method: 'DELETE' })
      setNotice('Suppression effectuée.')
      await loadData(active)
    } catch (err) {
      setError(getError(err))
    } finally {
      setBusy(false)
    }
  }

  async function validateTransaction(type, item) {
    const label = type === 'achats' ? 'cet achat' : 'cette vente'
    if (!window.confirm(`Voulez-vous valider ${label} #${item.id} ?`)) return

    setBusy(true)
    setError('')
    setNotice('')

    try {
      await request(`${type}/${item.id}/valider/`, { method: 'POST' })
      setNotice(`${type === 'achats' ? 'Achat' : 'Vente'} validé avec succès.`)
      await loadData(active)
    } catch (err) {
      setError(getError(err))
    } finally {
      setBusy(false)
    }
  }

  const page = {
    produits: { title: 'Produits & Stocks', subtitle: 'Gérez votre catalogue et les niveaux de stock.' },
    clients: { title: 'Clients', subtitle: 'Gérez les informations de vos clients.' },
    fournisseurs: { title: 'Fournisseurs', subtitle: 'Gérez vos partenaires fournisseurs.' },
    achats: { title: 'Achats', subtitle: 'Créez des achats et validez les entrées en stock.' },
    ventes: { title: 'Ventes', subtitle: 'Créez des ventes et validez les sorties de stock.' },
  }[active]

  // Données du graphique : ventes et achats par date (7 dernières dates)
  const donneesTransactions = useMemo(() => {
    const parDate = {}
    const ajouter = (liste, champDate, cle) => {
      liste.forEach((item) => {
        const date = String(item[champDate] || '').slice(0, 10)
        if (!date) return
        if (!parDate[date]) parDate[date] = { date, ventes: 0, achats: 0 }
        parDate[date][cle] += Number(item.montant_total || 0)
      })
    }
    ajouter(ventes, 'date_vente', 'ventes')
    ajouter(achats, 'date_achat', 'achats')
    return Object.values(parDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
  }, [ventes, achats])

  // Données du graphique : quantités en stock (8 premiers produits)
  const donneesStock = useMemo(
    () =>
      [...produits]
        .sort((a, b) => Number(b.quantite || 0) - Number(a.quantite || 0))
        .slice(0, 8)
        .map((p) => ({
          nom: p.nom || p.reference || 'Produit',
          quantite: Number(p.quantite || 0),
        })),
    [produits],
  )

  const lowStock = produits.filter(
    (p) => Number(p.quantite) <= Number(p.seuil_alerte),
  )

  const totalStockValue = produits.reduce(
    (sum, p) => sum + Number(p.quantite || 0) * Number(p.prix_achat || 0),
    0,
  )

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return produits.filter((p) =>
      [p.reference, p.nom, p.categorie].some((value) =>
        String(value || '').toLowerCase().includes(q),
      ),
    )
  }, [produits, search])

  const filteredPeople = useMemo(() => {
    const rows = active === 'clients' ? clients : fournisseurs
    const q = search.trim().toLowerCase()
    return rows.filter((p) =>
      [p.nom, p.telephone, p.email, p.adresse].some((value) =>
        String(value || '').toLowerCase().includes(q),
      ),
    )
  }, [active, clients, fournisseurs, search])

  const filteredTransactions = active === 'achats' ? achats : ventes
  const filteredTx = filteredTransactions.filter((item) => {
    const person = active === 'achats' ? item.fournisseur : item.client
    const personName =
      typeof person === 'object' ? person?.nom : String(person || '')
    const q = search.trim().toLowerCase()

    return (
      !q ||
      String(item.id).includes(q) ||
      String(item.statut || '').toLowerCase().includes(q) ||
      personName.toLowerCase().includes(q)
    )
  })

  if (!token) return <Login onLogin={login} />

  return (
    <div className="layout">
      {mobileOpen && (
        <button
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <span className="brand-logo">G</span>
          <div>
            <h2>GestCom</h2>
            <span>Gestion commerciale</span>
          </div>
        </div>

        <p className="menu-caption">MENU PRINCIPAL</p>

        <nav className="navigation">
          {MENUS.map((menu) => (
            <button
              key={menu.id}
              className={`nav-item ${active === menu.id ? 'nav-active' : ''}`}
              onClick={() => {
                setActive(menu.id)
                setSearch('')
                setShowForm(false)
                setEditing(null)
                setMobileOpen(false)
                setError('')
                setNotice('')
              }}
            >
              <span className="nav-icon">{menu.icon}</span>
              {menu.label}
              {active === menu.id && <span className="active-marker" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">?</span>
            <div>
              <strong>Besoin d’aide ?</strong>
              <p>Gérez vos produits, vos clients et vos opérations.</p>
            </div>
          </div>
          <p className="version">GestCom · Gestion commerciale</p>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMobileOpen((old) => !old)}
              aria-label="Ouvrir le menu"
            >
              ☰
            </button>
            <div className="breadcrumb">
              Espace de gestion <span>/</span>{' '}
              {MENUS.find((m) => m.id === active)?.label}
            </div>
          </div>

          <div className="user-area">
            <div className="user-avatar">
              {(username[0] || 'U').toUpperCase()}
            </div>
            <div className="user-details">
              <strong>{username}</strong>
              <span>Utilisateur connecté</span>
            </div>
            <button className="button-secondary logout-button" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </header>

        <div className="content">
          {error && (
            <div className="error-message" role="alert">
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Fermer">×</button>
            </div>
          )}
          {notice && (
            <div className="success-message" role="status">
              <span>{notice}</span>
              <button onClick={() => setNotice('')} aria-label="Fermer">×</button>
            </div>
          )}

          {active === 'dashboard' ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">VUE D’ENSEMBLE</p>
                  <h1>Tableau de bord</h1>
                  <p className="subtitle">
                    Bienvenue dans votre espace de gestion commerciale.
                  </p>
                </div>
                <button
                  className="button-secondary"
                  onClick={() => loadData('dashboard')}
                  disabled={loading}
                >
                  ↻ Actualiser
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-purple">▣</span>
                    <span className="stat-label">Produits enregistrés</span>
                  </div>
                  <strong className="stat-number">{produits.length}</strong>
                  <span className="stat-description">Références du catalogue</span>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-blue">♙</span>
                    <span className="stat-label">Clients</span>
                  </div>
                  <strong className="stat-number">{clients.length}</strong>
                  <span className="stat-description">Clients enregistrés</span>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-orange">↓</span>
                    <span className="stat-label">Achats validés</span>
                  </div>
                  <strong className="stat-number">
                    {achats.filter((a) => a.statut === 'valide').length}
                  </strong>
                  <span className="stat-description">Entrées de stock confirmées</span>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-icon icon-green">↑</span>
                    <span className="stat-label">Ventes validées</span>
                  </div>
                  <strong className="stat-number">
                    {ventes.filter((v) => v.statut === 'valide').length}
                  </strong>
                  <span className="stat-description">Sorties de stock confirmées</span>
                </div>
              </div>

              <div className="stats-grid stats-grid-secondary">
                <div className="stat-card">
                  <span className="stat-label">Valeur du stock au prix d’achat</span>
                  <strong className="stat-number stat-money">
                    {money(totalStockValue)}
                  </strong>
                  <span className="stat-description">Estimation de la valeur des stocks</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Alertes de stock</span>
                  <strong className="stat-number">{lowStock.length}</strong>
                  <span className="stat-description">Produits au seuil ou en dessous</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Fournisseurs</span>
                  <strong className="stat-number">{fournisseurs.length}</strong>
                  <span className="stat-description">Partenaires enregistrés</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Opérations en brouillon</span>
                  <strong className="stat-number">
                    {achats.filter((a) => a.statut === 'brouillon').length +
                      ventes.filter((v) => v.statut === 'brouillon').length}
                  </strong>
                  <span className="stat-description">Achats et ventes à valider</span>
                </div>
              </div>

              <div className="dashboard-grid">
                <section className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Ventes et achats</h2>
                      <p>Montants par date (Ar)</p>
                    </div>
                  </div>
                  {donneesTransactions.length ? (
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={donneesTransactions}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            interval={0}
                            tick={{ fontSize: 11 }}
                            tickFormatter={(d) => String(d).slice(5)}
                          />
                          <YAxis tick={{ fontSize: 11 }} width={48} />
                          <Tooltip
                            formatter={(value) =>
                              `${Number(value).toLocaleString('fr-FR')} Ar`
                            }
                          />
                          <Legend />
                          <Bar dataKey="ventes" name="Ventes" fill="#6259d9" />
                          <Bar dataKey="achats" name="Achats" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState>Aucune vente ou aucun achat à afficher.</EmptyState>
                  )}
                </section>

                <section className="panel chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Quantités en stock</h2>
                      <p>Quantité disponible par produit</p>
                    </div>
                  </div>
                  {donneesStock.length ? (
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={donneesStock}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="nom"
                            interval={0}
                            angle={-25}
                            textAnchor="end"
                            height={70}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={40} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="quantite" name="Quantité en stock" fill="#16a34a" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState>Aucun produit à afficher.</EmptyState>
                  )}
                </section>
              </div>

              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Produits récents</h2>
                      <p>Derniers produits du catalogue</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setActive('produits')}
                    >
                      Voir tout →
                    </button>
                  </div>
                  {produits.length ? (
                    <div className="recent-list">
                      {produits.slice(0, 5).map((p) => (
                        <div className="recent-item" key={p.id}>
                          <span className="product-avatar">▣</span>
                          <div className="recent-product">
                            <strong>{p.nom}</strong>
                            <span>{p.reference} · {p.categorie || 'Sans catégorie'}</span>
                          </div>
                          <div className="recent-stock">
                            <strong>{p.quantite} unité(s)</strong>
                            <span>{money(p.prix_vente)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>Aucun produit enregistré.</EmptyState>
                  )}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Alertes de stock</h2>
                      <p>Produits au niveau d’alerte</p>
                    </div>
                    <span className="alert-count">{lowStock.length}</span>
                  </div>
                  {lowStock.length ? (
                    <div className="alert-list">
                      {lowStock.slice(0, 7).map((p) => (
                        <div className="alert-item" key={p.id}>
                          <div>
                            <strong>{p.nom}</strong>
                            <span>Seuil : {p.seuil_alerte}</span>
                          </div>
                          <span className="status status-annule">
                            Stock : {p.quantite}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>
                      <span className="success-symbol">✓</span>
                      <p>Aucune alerte de stock pour le moment.</p>
                    </EmptyState>
                  )}
                </section>
              </div>

              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Derniers achats</h2>
                      <p>Historique des entrées</p>
                    </div>
                    <button className="text-button" onClick={() => setActive('achats')}>
                      Voir tout →
                    </button>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>N°</th><th>Fournisseur</th><th>Montant</th><th>Statut</th></tr></thead>
                      <tbody>
                        {achats.slice(0, 5).map((a) => (
                          <tr key={a.id}>
                            <td>#{a.id}</td>
                            <td>{typeof a.fournisseur === 'object' ? a.fournisseur?.nom : fournisseurs.find((f) => f.id === a.fournisseur)?.nom || '—'}</td>
                            <td>{money(a.montant_total)}</td>
                            <td><StatusBadge value={a.statut} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!achats.length && <EmptyState>Aucun achat enregistré.</EmptyState>}
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Dernières ventes</h2>
                      <p>Historique des sorties</p>
                    </div>
                    <button className="text-button" onClick={() => setActive('ventes')}>
                      Voir tout →
                    </button>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>N°</th><th>Client</th><th>Montant</th><th>Statut</th></tr></thead>
                      <tbody>
                        {ventes.slice(0, 5).map((v) => (
                          <tr key={v.id}>
                            <td>#{v.id}</td>
                            <td>{typeof v.client === 'object' ? v.client?.nom : clients.find((c) => c.id === v.client)?.nom || 'Client comptant'}</td>
                            <td>{money(v.montant_total)}</td>
                            <td><StatusBadge value={v.statut} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!ventes.length && <EmptyState>Aucune vente enregistrée.</EmptyState>}
                </section>
              </div>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">GESTION COMMERCIALE</p>
                  <h1>{page?.title}</h1>
                  <p className="subtitle">{page?.subtitle}</p>
                </div>
                <div className="page-actions">
                  <button
                    className="button-secondary"
                    onClick={() => loadData(active)}
                    disabled={loading}
                  >
                    ↻ Actualiser
                  </button>
                  <button className="button-primary" onClick={openCreate}>
                    + Ajouter
                  </button>
                </div>
              </div>

              {showForm && (
                <section className="panel data-panel form-panel">
                  {active === 'produits' && (
                    <ProductForm
                      key={editing?.id || 'new-product'}
                      initial={editing}
                      busy={busy}
                      onCancel={closeForm}
                      onSave={(payload) =>
                        saveEntity('produits/', payload, editing?.id)
                      }
                    />
                  )}

                  {active === 'clients' && (
                    <PersonForm
                      key={editing?.id || 'new-client'}
                      initial={editing}
                      title={editing ? 'Modifier le client' : 'Nouveau client'}
                      busy={busy}
                      onCancel={closeForm}
                      onSave={(payload) =>
                        saveEntity('clients/', payload, editing?.id)
                      }
                    />
                  )}

                  {active === 'fournisseurs' && (
                    <PersonForm
                      key={editing?.id || 'new-supplier'}
                      initial={editing}
                      title={editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                      busy={busy}
                      onCancel={closeForm}
                      onSave={(payload) =>
                        saveEntity('fournisseurs/', payload, editing?.id)
                      }
                    />
                  )}

                  {(active === 'achats' || active === 'ventes') && (
                    <TransactionForm
                      key={`${active}-new`}
                      type={active}
                      products={produits}
                      people={active === 'achats' ? fournisseurs : clients}
                      busy={busy}
                      onCancel={closeForm}
                      onSave={(payload) => saveEntity(`${active}/`, payload)}
                    />
                  )}
                </section>
              )}

              {active !== 'achats' && active !== 'ventes' && (
                <section className="panel data-panel">
                  <div className="product-tools">
                    <input
                      className="search-input"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={
                        active === 'produits'
                          ? 'Rechercher par référence, nom ou catégorie…'
                          : 'Rechercher par nom, téléphone ou email…'
                      }
                    />
                  </div>

                  {loading ? (
                    <EmptyState>Chargement des données…</EmptyState>
                  ) : active === 'produits' ? (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Référence</th><th>Produit</th><th>Catégorie</th>
                            <th>Stock</th><th>Prix d’achat</th><th>Prix de vente</th>
                            <th>État</th><th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((p) => (
                            <tr key={p.id}>
                              <td><strong>{p.reference}</strong></td>
                              <td>{p.nom}</td>
                              <td>{p.categorie || '—'}</td>
                              <td>{p.quantite}</td>
                              <td>{money(p.prix_achat)}</td>
                              <td>{money(p.prix_vente)}</td>
                              <td>
                                {Number(p.quantite) <= Number(p.seuil_alerte)
                                  ? <span className="status status-annule">Stock bas</span>
                                  : <span className="status status-valide">Disponible</span>}
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button className="action-edit" onClick={() => openEdit(p)}>Modifier</button>
                                  <button className="action-delete" disabled={busy} onClick={() => deleteEntity('produits/', p, `le produit ${p.nom}`)}>Supprimer</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!filteredProducts.length && <EmptyState>Aucun produit trouvé.</EmptyState>}
                    </div>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Nom</th><th>Téléphone</th><th>Email</th>
                            <th>Adresse</th><th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPeople.map((p) => (
                            <tr key={p.id}>
                              <td><strong>{p.nom}</strong></td>
                              <td>{p.telephone || '—'}</td>
                              <td>{p.email || '—'}</td>
                              <td className="address-cell">{p.adresse || '—'}</td>
                              <td>
                                <div className="row-actions">
                                  <button className="action-edit" onClick={() => openEdit(p)}>Modifier</button>
                                  <button
                                    className="action-delete"
                                    disabled={busy}
                                    onClick={() =>
                                      deleteEntity(
                                        active === 'clients' ? 'clients/' : 'fournisseurs/',
                                        p,
                                        `${active === 'clients' ? 'le client' : 'le fournisseur'} ${p.nom}`,
                                      )
                                    }
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!filteredPeople.length && <EmptyState>Aucun résultat trouvé.</EmptyState>}
                    </div>
                  )}
                </section>
              )}

              {(active === 'achats' || active === 'ventes') && (
                <section className="panel data-panel">
                  <div className="product-tools">
                    <input
                      className="search-input"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher par numéro, partenaire ou statut…"
                    />
                  </div>

                  {loading ? (
                    <EmptyState>Chargement des données…</EmptyState>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>N°</th>
                            <th>{active === 'achats' ? 'Fournisseur' : 'Client'}</th>
                            <th>Date</th><th>Lignes</th><th>Montant</th>
                            <th>Statut</th><th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTx.map((item) => {
                            const person = active === 'achats' ? item.fournisseur : item.client
                            const partner =
                              typeof person === 'object'
                                ? person?.nom
                                : (active === 'achats' ? fournisseurs : clients).find((p) => p.id === person)?.nom ||
                                  (active === 'ventes' ? 'Client comptant' : '—')

                            return (
                              <tr key={item.id}>
                                <td><strong>#{item.id}</strong></td>
                                <td>{partner || '—'}</td>
                                <td>{dateText(active === 'achats' ? item.date_achat : item.date_vente)}</td>
                                <td>{item.lignes?.length || 0}</td>
                                <td>{money(item.montant_total)}</td>
                                <td><StatusBadge value={item.statut} /></td>
                                <td>
                                  <div className="row-actions">
                                    {item.statut === 'brouillon' && (
                                      <button
                                        className="action-edit"
                                        disabled={busy}
                                        onClick={() => validateTransaction(active, item)}
                                      >
                                        Valider
                                      </button>
                                    )}
                                    {item.statut === 'brouillon' && (
                                      <button
                                        className="action-delete"
                                        disabled={busy}
                                        onClick={() =>
                                          deleteEntity(
                                            `${active}/`,
                                            item,
                                            `${active === 'achats' ? 'l’achat' : 'la vente'} #${item.id}`,
                                          )
                                        }
                                      >
                                        Supprimer
                                      </button>
                                    )}
                                    {item.statut !== 'brouillon' && <span className="muted">Aucune action</span>}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                      {!filteredTx.length && <EmptyState>Aucune opération trouvée.</EmptyState>}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          <footer className="footer">
            <span>© {new Date().getFullYear()} GestCom</span>
            <span>Gestion commerciale · Tous droits réservés</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App