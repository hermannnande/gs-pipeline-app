import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../lib/chatApi';
import EmojiPicker from './EmojiPicker';
import toast from 'react-hot-toast';

interface MessageInputProps {
  conversationId: number;
  chatSocket: any;
}

export default function MessageInput({ conversationId, chatSocket }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  // Gérer l'indicateur "en train d'écrire"
  useEffect(() => {
    if (message.trim().length > 0 && !isTyping) {
      setIsTyping(true);
      chatSocket.startTyping(conversationId);
    }

    if (message.trim().length === 0 && isTyping) {
      setIsTyping(false);
      chatSocket.stopTyping(conversationId);
    }

    // Reset du timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (message.trim().length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        chatSocket.stopTyping(conversationId);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, conversationId, chatSocket]);

  // Mutation pour envoyer un fichier
  const sendFileMutation = useMutation({
    mutationFn: (data: { file: File; content?: string }) =>
      chatApi.sendFile(conversationId, data.file, data.content),
    onSuccess: (data) => {
      const newMessage = data?.message;
      if (newMessage) {
        queryClient.setQueryData(['messages', conversationId], (old: any) => {
          if (!old) return { messages: [newMessage] };
          const exists = old.messages?.some((m: any) => m.id === newMessage.id);
          if (exists) return old;
          return { messages: [...(old.messages || []), newMessage] };
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedFile(null);
      setMessage('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Échec de l'envoi du fichier");
    }
  });

  // Mutation pour envoyer un message texte (fiable) via REST
  const sendTextMutation = useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(conversationId, { content }),
    onSuccess: (data) => {
      const newMessage = data?.message;
      if (newMessage) {
        queryClient.setQueryData(['messages', conversationId], (old: any) => {
          if (!old) return { messages: [newMessage] };
          const exists = old.messages?.some((m: any) => m.id === newMessage.id);
          if (exists) return old;
          return { messages: [...(old.messages || []), newMessage] };
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    },
    onError: (err: any) => {
      // IMPORTANT: ne pas vider le champ si l'envoi échoue
      toast.error(err?.response?.data?.error || "Message non envoyé (réessayez)");
    }
  });

  const handleSend = () => {
    if (selectedFile) {
      // Envoyer le fichier via API REST
      sendFileMutation.mutate({
        file: selectedFile,
        content: message.trim() || undefined
      });
    } else if (message.trim()) {
      // Envoyer le message texte via API REST (plus fiable que le socket seul)
      sendTextMutation.mutate(message.trim());
    }

    // Arrêter l'indicateur "en train d'écrire"
    setIsTyping(false);
    chatSocket.stopTyping(conversationId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Fichier trop volumineux (max 10MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {/* Fichier sélectionné */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {selectedFile.type.startsWith('image/') ? '📷' : '📎'}
            </span>
            <div>
              <p className="font-semibold text-sm text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-600">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <button
            onClick={removeSelectedFile}
            className="text-red-600 hover:text-red-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Bouton fichier */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Joindre un fichier"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />

        {/* Bouton emoji */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Ajouter un emoji"
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-10">
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
            </div>
          )}
        </div>

        {/* Zone de texte */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Écrivez votre message..."
          className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          rows={1}
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />

        {/* Bouton envoyer */}
        <button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || sendFileMutation.isPending || sendTextMutation.isPending}
          className={`p-2 rounded-lg transition-colors ${
            message.trim() || selectedFile
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Envoyer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
      </p>
    </div>
  );
}

