import React from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const emojiCategories = {
    '😀 Smileys': [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
      '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨'
    ],
    '👍 Gestes': [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️',
      '🖖', '👋', '🤝', '👏', '🙌', '👐', '🤲', '🙏'
    ],
    '❤️ Cœurs': [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️'
    ],
    '🔥 Objets': [
      '🔥', '⭐', '✨', '💫', '⚡', '💥', '💢', '💯',
      '✅', '❌', '⚠️', '🚫', '🔴', '🟠', '🟡', '🟢',
      '🔵', '🟣', '⚫', '⚪', '🟤', '📌', '📍', '🎯'
    ],
    '🎉 Fêtes': [
      '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉',
      '🏅', '🎖️', '🎗️', '🎵', '🎶', '🎤', '🎧', '📢',
      '📣', '📯', '🔔', '🔕', '🎺', '🎷', '🎸', '🎻'
    ]
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-3 w-80 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Choisir un emoji</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 font-bold"
        >
          ✕
        </button>
      </div>

      {Object.entries(emojiCategories).map(([category, emojis]) => (
        <div key={category} className="mb-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">{category}</h4>
          <div className="grid grid-cols-8 gap-1">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onSelect(emoji)}
                className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

