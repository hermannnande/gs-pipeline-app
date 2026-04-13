import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Plus, Copy, Pencil, Trash2, Eye, EyeOff, ExternalLink,
  FileText, Search, X, Save, ChevronLeft, Loader2, Layout,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Template {
  id: number;
  nom: string;
  slug: string;
  description: string | null;
  productCode: string | null;
  productId: number | null;
  config: string;
  assetsFolder: string | null;
  actif: boolean;
  createdAt: string;
  updatedAt: string;
  product: { id: number; nom: string; code: string; imageUrl?: string } | null;
}

interface Product {
  id: number;
  nom: string;
  code: string;
}

type View = 'list' | 'edit';

export default function LandingTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('list');
  const [editing, setEditing] = useState<Template | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nom: '', slug: '', description: '', productCode: '', productId: '',
    assetsFolder: '', actif: true, config: '{}',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/templates');
      setTemplates(data.templates || []);
    } catch { toast.error('Erreur chargement templates'); }
    finally { setLoading(false); }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
    } catch {}
  }, []);

  useEffect(() => { load(); loadProducts(); }, [load, loadProducts]);

  const filtered = templates.filter(t =>
    t.nom.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    (t.productCode || '').toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm({ nom: '', slug: '', description: '', productCode: '', productId: '', assetsFolder: '', actif: true, config: '{}' });
    setView('edit');
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    let cfgStr = t.config;
    try { cfgStr = JSON.stringify(JSON.parse(t.config), null, 2); } catch {}
    setForm({
      nom: t.nom, slug: t.slug, description: t.description || '',
      productCode: t.productCode || '', productId: t.productId ? String(t.productId) : '',
      assetsFolder: t.assetsFolder || '', actif: t.actif, config: cfgStr,
    });
    setView('edit');
  };

  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleNomChange = (v: string) => {
    setForm(f => ({ ...f, nom: v, ...(editing ? {} : { slug: slugify(v) }) }));
  };

  const saveTemplate = async () => {
    if (!form.nom.trim() || !form.slug.trim()) { toast.error('Nom et slug requis'); return; }
    try { JSON.parse(form.config); } catch { toast.error('Config JSON invalide'); return; }

    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(), slug: form.slug.trim(), description: form.description.trim() || null,
        productCode: form.productCode.trim() || null,
        productId: form.productId ? parseInt(form.productId) : null,
        assetsFolder: form.assetsFolder.trim() || null,
        actif: form.actif, config: form.config,
      };

      if (editing) {
        await api.put(`/templates/${editing.id}`, payload);
        toast.success('Template mis a jour');
      } else {
        await api.post('/templates', payload);
        toast.success('Template cree');
      }
      await load();
      setView('list');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erreur');
    } finally { setSaving(false); }
  };

  const toggleActive = async (t: Template) => {
    try {
      await api.put(`/templates/${t.id}`, { actif: !t.actif });
      toast.success(t.actif ? 'Template desactive' : 'Template active');
      load();
    } catch { toast.error('Erreur'); }
  };

  const duplicate = async (t: Template) => {
    try {
      await api.post(`/templates/${t.id}/duplicate`);
      toast.success('Template duplique');
      load();
    } catch { toast.error('Erreur'); }
  };

  const remove = async (t: Template) => {
    if (!confirm(`Supprimer le template "${t.nom}" ?`)) return;
    try {
      await api.delete(`/templates/${t.id}`);
      toast.success('Template supprime');
      load();
    } catch { toast.error('Erreur'); }
  };

  if (view === 'edit') {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200">
            <ChevronLeft className="h-4 w-4" /> Retour
          </button>
          <h2 className="text-xl font-bold text-neutral-900">
            {editing ? `Modifier : ${editing.nom}` : 'Nouveau template'}
          </h2>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-700">Nom du template *</label>
              <input value={form.nom} onChange={e => handleNomChange(e.target.value)} className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Ex: Creme Anti-Verrue"/>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-700">Slug (URL) *</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">/landing/</span>
                <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="creme-anti-verrue"/>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-neutral-700">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Description courte du template..."/>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-700">Produit lie</label>
              <select value={form.productId} onChange={e => {
                const p = products.find(pr => pr.id === parseInt(e.target.value));
                setForm(f => ({ ...f, productId: e.target.value, productCode: p?.code || '' }));
              }} className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option value="">— Aucun —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-neutral-700">Dossier assets</label>
              <input value={form.assetsFolder} onChange={e => setForm(f => ({ ...f, assetsFolder: e.target.value }))} className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="verrue-tk"/>
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} className="peer sr-only"/>
                <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-blue-200"/>
              </label>
              <span className="text-sm font-medium text-neutral-700">Page active (visible publiquement)</span>
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-1 block text-sm font-semibold text-neutral-700">Configuration (JSON)</label>
            <p className="mb-2 text-xs text-neutral-400">Contient les textes, images, sections, couleurs et prix du template.</p>
            <textarea value={form.config} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} rows={18} className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 font-mono text-xs leading-relaxed outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" spellCheck={false}/>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={() => setView('list')} className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50">Annuler</button>
            <button onClick={saveTemplate} disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
              {editing ? 'Mettre a jour' : 'Creer le template'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2.5">
            <Layout className="h-6 w-6 text-blue-600"/> Pages de vente
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">{templates.length} template{templates.length > 1 ? 's' : ''} enregistre{templates.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4"/> Nouveau template
        </button>
      </div>

      {templates.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un template..." className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-9 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-neutral-400"/></button>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-neutral-300"/>
          <p className="text-sm font-semibold text-neutral-500">
            {search ? 'Aucun template trouve' : 'Aucun template de page de vente'}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {search ? 'Essayez un autre terme.' : 'Creez votre premier template pour commencer.'}
          </p>
          {!search && (
            <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4"/> Creer un template
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(t => {
            let heroImg = '';
            try {
              const cfg = JSON.parse(t.config);
              heroImg = cfg.hero?.image || cfg.images?.hero || '';
            } catch {}
            if (!heroImg && t.assetsFolder) heroImg = `/${t.assetsFolder}/hero.webp`;

            return (
              <div key={t.id} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="relative h-40 bg-gradient-to-br from-neutral-100 to-neutral-50">
                  {heroImg ? (
                    <img src={heroImg} alt="" className="h-full w-full object-cover"/>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FileText className="h-12 w-12 text-neutral-200"/>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white drop-shadow">{t.nom}</h3>
                      <p className="text-[11px] text-white/70">/landing/{t.slug}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.actif ? 'bg-emerald-500 text-white' : 'bg-neutral-600 text-neutral-200'}`}>
                      {t.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  {t.product && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-1.5">
                      <span className="text-xs">📦</span>
                      <span className="text-[11px] font-semibold text-blue-700">{t.product.nom}</span>
                      <span className="text-[10px] text-blue-400">({t.product.code})</span>
                    </div>
                  )}
                  {t.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-neutral-500">{t.description}</p>
                  )}
                  <p className="mb-3 text-[10px] text-neutral-400">
                    Modifie le {new Date(t.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => openEdit(t)} className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50" title="Modifier">
                      <Pencil className="h-3 w-3"/> Modifier
                    </button>
                    <button onClick={() => duplicate(t)} className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[11px] font-semibold text-neutral-600 hover:bg-neutral-50" title="Dupliquer">
                      <Copy className="h-3 w-3"/> Dupliquer
                    </button>
                    <button onClick={() => toggleActive(t)} className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${t.actif ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`} title={t.actif ? 'Desactiver' : 'Activer'}>
                      {t.actif ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>}
                      {t.actif ? 'Desactiver' : 'Activer'}
                    </button>
                    {t.actif && (
                      <a href={`/landing/${t.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100">
                        <ExternalLink className="h-3 w-3"/> Voir
                      </a>
                    )}
                    <button onClick={() => remove(t)} className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100" title="Supprimer">
                      <Trash2 className="h-3 w-3"/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
