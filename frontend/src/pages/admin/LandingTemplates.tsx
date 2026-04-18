import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Plus, Copy, Pencil, Trash2, Eye, EyeOff, ExternalLink,
  FileText, Search, X, Save, ChevronLeft, Loader2,
  Globe, Package, Clock, ToggleLeft, ToggleRight,
  Sparkles, Link2, FolderOpen, Code2, ArrowUpRight,
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

  const activeCount = templates.filter(t => t.actif).length;

  /* ════════════════════════ EDIT VIEW ════════════════════════ */
  if (view === 'edit') {
    return (
      <div className="mx-auto max-w-5xl">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="group flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white px-3.5 py-2 text-sm font-medium text-neutral-500 shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Retour
            </button>
            <div className="hidden h-6 w-px bg-neutral-200 sm:block" />
            <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">
              {editing ? editing.nom : 'Nouveau template'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('list')} className="hidden rounded-xl border border-neutral-200/80 px-4 py-2.5 text-sm font-medium text-neutral-500 transition-colors hover:bg-neutral-50 sm:block">Annuler</button>
            <button onClick={saveTemplate} disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 transition-all hover:shadow-xl hover:shadow-indigo-300/50 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
              {editing ? 'Sauvegarder' : 'Creer'}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main form */}
          <div className="space-y-5">
            {/* General info card */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
              <div className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50/80 to-white px-5 py-3.5">
                <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-neutral-500">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400"/>Informations generales
                </h3>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-neutral-700">Nom du template <span className="text-red-400">*</span></label>
                  <input value={form.nom} onChange={e => handleNomChange(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50" placeholder="Ex: Creme Anti-Verrue TK"/>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-neutral-700">Slug (URL) <span className="text-red-400">*</span></label>
                  <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/50 transition-all focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50">
                    <span className="flex items-center gap-1 border-r border-neutral-200 bg-neutral-100/60 px-3 py-2.5 text-xs font-medium text-neutral-400">
                      <Link2 className="h-3 w-3"/>obrille.com/
                    </span>
                    <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" placeholder="creme-anti-verrue"/>
                  </div>
                  {form.slug && (
                    <p className="mt-1.5 text-[11px] text-neutral-400">
                      Alias : coachingexpertci.com/{form.slug}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-neutral-700">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50" placeholder="Description courte du template..."/>
                </div>
              </div>
            </div>

            {/* Config JSON card */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 bg-gradient-to-r from-neutral-50/80 to-white px-5 py-3.5">
                <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-neutral-500">
                  <Code2 className="h-3.5 w-3.5 text-indigo-400"/>Configuration JSON
                </h3>
                <span className="rounded-lg bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">AVANCE</span>
              </div>
              <div className="p-5">
                <p className="mb-3 text-[12px] leading-relaxed text-neutral-400">Textes, images, sections, couleurs et prix du template. Modifiez uniquement si vous savez ce que vous faites.</p>
                <textarea value={form.config} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} rows={20} className="w-full rounded-xl border border-neutral-200 bg-[#1e1e2e] px-4 py-3 font-mono text-[12px] leading-relaxed text-emerald-300 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" spellCheck={false}/>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Status card */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
              <div className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50/80 to-white px-5 py-3.5">
                <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-neutral-500">
                  <Globe className="h-3.5 w-3.5 text-indigo-400"/>Publication
                </h3>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {form.actif ? <ToggleRight className="h-5 w-5 text-emerald-500"/> : <ToggleLeft className="h-5 w-5 text-neutral-300"/>}
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-700">{form.actif ? 'Active' : 'Brouillon'}</p>
                      <p className="text-[10px] text-neutral-400">{form.actif ? 'Visible publiquement' : 'Non visible'}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} className="peer sr-only"/>
                    <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-emerald-200"/>
                  </label>
                </div>
                {editing && form.actif && (
                  <div className="mt-3 space-y-1.5">
                    <a href={`https://obrille.com/${form.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-[12px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-100">
                      <ExternalLink className="h-3.5 w-3.5"/> obrille.com/{form.slug}
                    </a>
                    <a href={`https://coachingexpertci.com/${form.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-[11px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-100">
                      <ExternalLink className="h-3 w-3"/> coachingexpertci.com/{form.slug}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Product card */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
              <div className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50/80 to-white px-5 py-3.5">
                <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-neutral-500">
                  <Package className="h-3.5 w-3.5 text-indigo-400"/>Produit lie
                </h3>
              </div>
              <div className="p-5">
                <select value={form.productId} onChange={e => {
                  const p = products.find(pr => pr.id === parseInt(e.target.value));
                  setForm(f => ({ ...f, productId: e.target.value, productCode: p?.code || '' }));
                }} className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50">
                  <option value="">— Aucun produit —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.code})</option>)}
                </select>
                {form.productCode && (
                  <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                    <span className="text-xs">📦</span>
                    <span className="text-[11px] font-semibold text-emerald-700">Code: {form.productCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assets card */}
            <div className="overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
              <div className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50/80 to-white px-5 py-3.5">
                <h3 className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-neutral-500">
                  <FolderOpen className="h-3.5 w-3.5 text-indigo-400"/>Assets
                </h3>
              </div>
              <div className="p-5">
                <label className="mb-1.5 block text-[12px] font-medium text-neutral-500">Dossier d'images</label>
                <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50/50 transition-all focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50">
                  <span className="border-r border-neutral-200 bg-neutral-100/60 px-3 py-2.5 text-xs text-neutral-400">/public/</span>
                  <input value={form.assetsFolder} onChange={e => setForm(f => ({ ...f, assetsFolder: e.target.value }))} className="w-full bg-transparent px-3 py-2.5 text-sm outline-none" placeholder="verrue-tk"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════ LIST VIEW ════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 shadow-lg shadow-indigo-100/50 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-white sm:text-[1.65rem]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><Globe className="h-5 w-5 text-white"/></div>
              Pages de vente
            </h1>
            <p className="mt-1.5 text-sm text-indigo-100/80">Gerez vos landing pages et templates de vente</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 self-start rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-lg shadow-black/10 transition-all hover:shadow-xl hover:shadow-black/15 active:scale-[.97]">
            <Plus className="h-4 w-4"/> Nouveau template
          </button>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3 sm:mt-6">
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-2xl font-black text-white">{templates.length}</p>
            <p className="text-[11px] font-medium text-indigo-200/80">Total templates</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-2xl font-black text-emerald-300">{activeCount}</p>
            <p className="text-[11px] font-medium text-indigo-200/80">Pages actives</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-2xl font-black text-amber-300">{templates.length - activeCount}</p>
            <p className="text-[11px] font-medium text-indigo-200/80">Brouillons</p>
          </div>
        </div>
      </div>

      {/* Search */}
      {templates.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un template par nom, slug ou produit..." className="w-full rounded-xl border border-neutral-200/80 bg-white py-3 pl-11 pr-10 text-sm shadow-sm outline-none transition-all focus:border-indigo-300 focus:shadow-md focus:ring-4 focus:ring-indigo-50"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 hover:bg-neutral-100"><X className="h-4 w-4 text-neutral-400"/></button>}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative mb-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-100"/>
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-indigo-500"/>
          </div>
          <p className="text-sm text-neutral-400">Chargement des templates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <FileText className="h-8 w-8 text-indigo-300"/>
          </div>
          <p className="text-base font-bold text-neutral-700">
            {search ? 'Aucun resultat' : 'Aucun template'}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-neutral-400">
            {search ? `Aucun template ne correspond a "${search}".` : 'Commencez par creer votre premier template de page de vente.'}
          </p>
          {!search && (
            <button onClick={openNew} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 hover:shadow-xl">
              <Plus className="h-4 w-4"/> Creer un template
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(t => {
            let heroImg = '';
            try {
              const cfg = JSON.parse(t.config);
              heroImg = cfg.hero?.image || cfg.images?.hero || '';
            } catch {}
            if (!heroImg && t.assetsFolder) heroImg = `/${t.assetsFolder}/hero.webp`;

            return (
              <div key={t.id} className="group relative overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/60">
                {/* Hero image */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50">
                  {heroImg ? (
                    <img src={heroImg} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                        <FileText className="h-8 w-8 text-indigo-200"/>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"/>

                  {/* Status badge */}
                  <div className="absolute right-3 top-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md ${t.actif ? 'bg-emerald-500/90 text-white' : 'bg-neutral-800/70 text-neutral-300'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${t.actif ? 'bg-white animate-pulse' : 'bg-neutral-400'}`}/>
                      {t.actif ? 'En ligne' : 'Brouillon'}
                    </span>
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-[15px] font-bold text-white drop-shadow-lg">{t.nom}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/60">
                      <Link2 className="h-3 w-3"/>obrille.com/{t.slug}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 pt-3.5">
                  {/* Product & meta */}
                  <div className="mb-3.5 flex flex-wrap items-center gap-2">
                    {t.product && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                        <Package className="h-3 w-3 text-indigo-400"/>{t.product.nom}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-400">
                      <Clock className="h-3 w-3"/>
                      {new Date(t.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>

                  {t.description && (
                    <p className="mb-3.5 line-clamp-2 text-[12px] leading-relaxed text-neutral-500">{t.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 border-t border-neutral-100 pt-3.5">
                    <button onClick={() => openEdit(t)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 py-2 text-[12px] font-semibold text-neutral-600 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                      <Pencil className="h-3.5 w-3.5"/> Modifier
                    </button>
                    <button onClick={() => duplicate(t)} className="flex items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-2 text-neutral-500 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600" title="Dupliquer">
                      <Copy className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={() => toggleActive(t)} className={`flex items-center justify-center rounded-xl border p-2 transition-all ${t.actif ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`} title={t.actif ? 'Desactiver' : 'Activer'}>
                      {t.actif ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
                    </button>
                    {t.actif && (
                      <a href={`https://obrille.com/${t.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-indigo-600 transition-all hover:bg-indigo-100" title={`Voir en ligne : obrille.com/${t.slug}`}>
                        <ArrowUpRight className="h-3.5 w-3.5"/>
                      </a>
                    )}
                    <button onClick={() => remove(t)} className="flex items-center justify-center rounded-xl border border-red-200/80 bg-red-50/50 p-2 text-red-400 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600" title="Supprimer">
                      <Trash2 className="h-3.5 w-3.5"/>
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
