import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle, Search, Send, User, Bot, Phone,
  MapPin, Package, ArrowLeft, HandMetal,
  CheckCircle, AlertTriangle, Mic, Image,
  ShoppingCart, Hash,
} from 'lucide-react';
import { whatsappApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface WaConversation {
  id: number;
  waId: string;
  customerName: string | null;
  customerPhone: string | null;
  status: string;
  convState: string;
  unreadCount: number;
  extractedProduct: string | null;
  extractedProductId: number | null;
  extractedQty: number | null;
  extractedName: string | null;
  extractedPhone: string | null;
  extractedCity: string | null;
  extractedCommune: string | null;
  extractedAddress: string | null;
  confidenceScore: number;
  orderId: number | null;
  lastIntent: string | null;
  lastBotMessage: string | null;
  handoffReason: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  assignedUser: { id: number; nom: string; prenom: string } | null;
  _count?: { messages: number };
  messages?: WaMessage[];
}

interface WaMessage {
  id: number;
  direction: 'INBOUND' | 'OUTBOUND';
  actor: 'CUSTOMER' | 'BOT' | 'HUMAN' | 'SYSTEM';
  contentType: string;
  body: string | null;
  transcription: string | null;
  transcriptionOk: boolean | null;
  mediaUrl: string | null;
  mediaMimeType: string | null;
  timestamp: string;
}

interface WaStats {
  total: number;
  botActive: number;
  humanHandoff: number;
  resolved: number;
  todayConversations: number;
  todayOrders: number;
  orderConversionRate: number;
  handoffRate: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Ouverte', color: 'text-blue-700', bg: 'bg-blue-100' },
  BOT_ACTIVE: { label: 'Bot actif', color: 'text-green-700', bg: 'bg-green-100' },
  HUMAN_HANDOFF: { label: 'Humain', color: 'text-orange-700', bg: 'bg-orange-100' },
  WAITING_CUSTOMER: { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  RESOLVED: { label: 'Résolu', color: 'text-gray-700', bg: 'bg-gray-100' },
  ARCHIVED: { label: 'Archivé', color: 'text-gray-500', bg: 'bg-gray-50' },
};

const ACTOR_STYLES: Record<string, { label: string; color: string }> = {
  CUSTOMER: { label: 'Client', color: 'bg-white border border-gray-200' },
  BOT: { label: 'Bot', color: 'bg-green-50 border border-green-200' },
  HUMAN: { label: 'Conseiller', color: 'bg-blue-50 border border-blue-200' },
  SYSTEM: { label: 'Système', color: 'bg-gray-50 border border-gray-200 italic' },
};

export default function WhatsAppInbox() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['wa-stats'],
    queryFn: whatsappApi.getStats,
    refetchInterval: false,
  });

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['wa-conversations', statusFilter, search],
    queryFn: () => whatsappApi.getConversations({ status: statusFilter || undefined, search: search || undefined }),
    refetchInterval: false,
  });

  const { data: convData } = useQuery({
    queryKey: ['wa-conversation', selectedId],
    queryFn: () => whatsappApi.getConversation(selectedId!),
    enabled: !!selectedId,
    refetchInterval: false,
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => whatsappApi.sendMessage(id, text),
    onSuccess: () => {
      setReplyText('');
      qc.invalidateQueries({ queryKey: ['wa-conversation', selectedId] });
      qc.invalidateQueries({ queryKey: ['wa-conversations'] });
    },
    onError: () => toast.error('Erreur envoi message'),
  });

  const handoffMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.handoff(id),
    onSuccess: () => {
      toast.success('Conversation prise en charge');
      qc.invalidateQueries({ queryKey: ['wa-conversation', selectedId] });
      qc.invalidateQueries({ queryKey: ['wa-conversations'] });
    },
  });

  const returnBotMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.returnToBot(id),
    onSuccess: () => {
      toast.success('Conversation rendue au bot');
      qc.invalidateQueries({ queryKey: ['wa-conversation', selectedId] });
      qc.invalidateQueries({ queryKey: ['wa-conversations'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => whatsappApi.resolve(id),
    onSuccess: () => {
      toast.success('Conversation résolue');
      qc.invalidateQueries({ queryKey: ['wa-conversations'] });
      qc.invalidateQueries({ queryKey: ['wa-conversation', selectedId] });
    },
  });

  const conversations: WaConversation[] = listData?.conversations || [];
  const conv: WaConversation | null = convData?.conversation || null;
  const stats: WaStats | null = statsData || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages]);

  const handleSend = () => {
    if (!replyText.trim() || !selectedId) return;
    sendMutation.mutate({ id: selectedId, text: replyText.trim() });
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white border-b">
          <StatMini icon={MessageCircle} label="Conversations" value={stats.total} sub={`${stats.todayConversations} aujourd'hui`} color="blue" />
          <StatMini icon={Bot} label="Bot actif" value={stats.botActive} color="green" />
          <StatMini icon={HandMetal} label="Handoff humain" value={stats.humanHandoff} sub={`${stats.handoffRate}% taux`} color="orange" />
          <StatMini icon={ShoppingCart} label="Commandes" value={stats.todayOrders} sub={`${stats.orderConversionRate}% conversion`} color="purple" />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Liste conversations */}
        <div className={`${selectedId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r bg-white`}>
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['', 'BOT_ACTIVE', 'HUMAN_HANDOFF', 'RESOLVED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${statusFilter === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  {s ? STATUS_LABELS[s]?.label || s : 'Toutes'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">Aucune conversation</div>
            ) : (
              conversations.map((c) => {
                const st = STATUS_LABELS[c.status] || STATUS_LABELS.OPEN;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${selectedId === c.id ? 'bg-primary-50 border-l-2 border-l-primary-600' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{c.customerName || c.waId}</span>
                          {c.unreadCount > 0 && (
                            <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{c.unreadCount}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {c.extractedProduct || c.lastIntent || 'Nouvelle conversation'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                        {c.lastMessageAt && (
                          <span className="text-xs text-gray-400">{formatTime(c.lastMessageAt)}</span>
                        )}
                      </div>
                    </div>
                    {c.confidenceScore > 0 && c.confidenceScore < 40 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-orange-600">Confiance faible ({c.confidenceScore}%)</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail conversation */}
        {selectedId && conv ? (
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedId(null)} className="md:hidden p-1 rounded hover:bg-gray-100">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{conv.customerName || conv.waId}</h3>
                  <p className="text-xs text-gray-500">{conv.waId} • {STATUS_LABELS[conv.status]?.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {conv.status === 'BOT_ACTIVE' && (
                  <button onClick={() => handoffMutation.mutate(conv.id)} className="px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center gap-1">
                    <HandMetal className="h-3 w-3" /> Prendre en charge
                  </button>
                )}
                {conv.status === 'HUMAN_HANDOFF' && (
                  <button onClick={() => returnBotMutation.mutate(conv.id)} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1">
                    <Bot className="h-3 w-3" /> Rendre au bot
                  </button>
                )}
                {conv.status !== 'RESOLVED' && conv.status !== 'ARCHIVED' && (
                  <button onClick={() => resolveMutation.mutate(conv.id)} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Résoudre
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Messages */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(conv.messages || []).map((msg) => {
                    const isInbound = msg.direction === 'INBOUND';
                    const actorStyle = ACTOR_STYLES[msg.actor] || ACTOR_STYLES.SYSTEM;
                    return (
                      <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[75%] rounded-xl px-3 py-2 ${actorStyle.color}`}>
                          <div className="flex items-center gap-1 mb-0.5">
                            {msg.actor === 'BOT' && <Bot className="h-3 w-3 text-green-600" />}
                            {msg.actor === 'HUMAN' && <User className="h-3 w-3 text-blue-600" />}
                            {msg.contentType === 'AUDIO' && <Mic className="h-3 w-3 text-purple-600" />}
                            {msg.contentType === 'IMAGE' && <Image className="h-3 w-3 text-pink-600" />}
                            <span className="text-[10px] text-gray-500">{actorStyle.label} • {formatTime(msg.timestamp)}</span>
                          </div>
                          {msg.contentType === 'AUDIO' && msg.transcription && (
                            <div className="text-xs bg-purple-50 text-purple-800 rounded px-2 py-1 mb-1 flex items-center gap-1">
                              <Mic className="h-3 w-3" /> Transcription : {msg.transcription}
                            </div>
                          )}
                          {msg.body && <p className="text-sm whitespace-pre-wrap">{msg.body}</p>}
                          {!msg.body && msg.contentType === 'AUDIO' && !msg.transcription && (
                            <p className="text-xs text-gray-400 italic">Message vocal (transcription indisponible)</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {(conv.status === 'HUMAN_HANDOFF' || conv.status === 'BOT_ACTIVE') && (
                  <div className="bg-white border-t p-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Écrire un message..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!replyText.trim() || sendMutation.isPending}
                        className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Panel extraction */}
              <div className="hidden lg:block w-72 border-l bg-white overflow-y-auto p-4 space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-1"><Package className="h-4 w-4" /> Extraction commande</h4>

                <div className="space-y-2 text-sm">
                  <ExtractRow icon={Package} label="Produit" value={conv.extractedProduct} />
                  <ExtractRow icon={Hash} label="Quantité" value={conv.extractedQty?.toString()} />
                  <ExtractRow icon={User} label="Nom" value={conv.extractedName} />
                  <ExtractRow icon={Phone} label="Téléphone" value={conv.extractedPhone} />
                  <ExtractRow icon={MapPin} label="Ville" value={conv.extractedCity} />
                  <ExtractRow icon={MapPin} label="Commune" value={conv.extractedCommune} />
                  <ExtractRow icon={MapPin} label="Adresse" value={conv.extractedAddress} />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Confiance</span>
                    <span className={`font-semibold ${conv.confidenceScore >= 60 ? 'text-green-600' : conv.confidenceScore >= 30 ? 'text-orange-600' : 'text-red-600'}`}>
                      {conv.confidenceScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${conv.confidenceScore >= 60 ? 'bg-green-500' : conv.confidenceScore >= 30 ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${conv.confidenceScore}%` }}
                    />
                  </div>
                </div>

                {conv.lastIntent && (
                  <div className="pt-2 border-t text-sm">
                    <span className="text-gray-600">Dernière intention :</span>
                    <span className="ml-1 font-medium">{conv.lastIntent}</span>
                  </div>
                )}

                {conv.convState && (
                  <div className="text-sm">
                    <span className="text-gray-600">État :</span>
                    <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{conv.convState}</span>
                  </div>
                )}

                {conv.orderId && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-1 text-green-700 text-sm font-medium">
                      <ShoppingCart className="h-4 w-4" />
                      Commande #{conv.orderId}
                    </div>
                  </div>
                )}

                {conv.handoffReason && (
                  <div className="pt-2 border-t text-sm">
                    <span className="text-gray-600">Raison handoff :</span>
                    <span className="ml-1 text-orange-600 font-medium">{conv.handoffReason}</span>
                  </div>
                )}

                {conv.assignedUser && (
                  <div className="text-sm">
                    <span className="text-gray-600">Assigné à :</span>
                    <span className="ml-1 font-medium">{conv.assignedUser.prenom} {conv.assignedUser.nom}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Sélectionnez une conversation</p>
              <p className="text-sm">pour voir les messages et répondre</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatMini({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-white border">
      <div className={`p-2 rounded-lg ${colors[color]}`}><Icon className="h-4 w-4" /></div>
      <div>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function ExtractRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm truncate ${value ? 'font-medium' : 'text-gray-300 italic'}`}>
          {value || 'Non renseigné'}
        </p>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'maintenant';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
