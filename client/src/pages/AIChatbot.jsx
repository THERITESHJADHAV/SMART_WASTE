import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';
import { MdSend, MdImage, MdSmartToy, MdPerson, MdClose, MdAutoAwesome } from 'react-icons/md';

const QUICK_PROMPTS = [
  '♻️ How to recycle plastic bottles?',
  '🔋 Where to dispose old batteries?',
  '📱 How to recycle e-waste safely?',
  '🧴 Can I recycle shampoo bottles?',
  '🛍️ Are plastic bags recyclable?',
  '💡 How to dispose of old light bulbs?',
];

/**
 * AI Chatbot Page — Gemini-powered recycling assistant with image support
 */
export default function AIChatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hi! I'm **EcoBot** 🌱 — your AI recycling assistant.\n\nI can help you with:\n- ♻️ **Recycling guidance** for any item\n- 📸 **Photo identification** — upload a picture and I'll tell you how to recycle it\n- 🗑️ **Waste disposal tips** and safety info\n- 📍 **Local recycling centers** near you in Mumbai\n\nAsk me anything or upload a photo to get started!",
    }
  ]);
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please use an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (text = input) => {
    if (!text.trim() && !imageBase64) return;

    const userMessage = {
      role: 'user',
      text: text.trim(),
      image: imagePreview,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const sentImage = imageBase64;
    removeImage();
    setLoading(true);

    try {
      const res = await sendChatMessage(text.trim(), sentImage);
      setMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '⚠️ Sorry, I encountered an error. Please try again. Make sure the Gemini API key is configured correctly.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simple markdown-ish rendering (bold, bullets)
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold
      let rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (rendered.trim().startsWith('- ')) {
        rendered = '<span class="inline-block ml-2">' + rendered.trim().slice(2) + '</span>';
        return <div key={i} className="flex items-start gap-1.5 my-0.5"><span className="text-[10px] mt-1.5">●</span><span dangerouslySetInnerHTML={{ __html: rendered }} /></div>;
      }
      // Numbered
      const numMatch = rendered.trim().match(/^(\d+)\.\s(.+)/);
      if (numMatch) {
        return <div key={i} className="flex items-start gap-1.5 my-0.5"><span className="font-bold text-xs mt-0.5 bg-black text-white w-5 h-5 rounded flex items-center justify-center shrink-0">{numMatch[1]}</span><span dangerouslySetInnerHTML={{ __html: numMatch[2] }} /></div>;
      }
      if (!rendered.trim()) return <br key={i} />;
      return <p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: rendered }} />;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)]">
      {/* Page Header */}
      <div className="page-header !mb-0 shrink-0" style={{ background: '#10b981' }}>
        <div className="page-header-inner !py-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white border-2 border-black shadow-[3px_3px_0px_#065f46]">
            <MdSmartToy size={28} />
          </div>
          <div>
            <h1 className="!text-2xl !text-white !mb-0">EcoBot AI</h1>
            <p className="page-subtitle !bg-[#065f46] !text-white !border-[#065f46] !shadow-none !text-[11px]">
              Powered by Gemma 3 · Recycling Expert
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#121212] ${
              msg.role === 'ai' ? 'bg-[#10b981] text-white' : 'bg-[#facc15] text-black'
            }`}>
              {msg.role === 'ai' ? <MdSmartToy size={20} /> : <MdPerson size={20} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[75%] border-3 border-black rounded-xl p-4 text-sm font-medium leading-relaxed shadow-[4px_4px_0px_#121212] ${
              msg.role === 'ai'
                ? 'bg-white text-black'
                : 'bg-[#facc15] text-black'
            }`} style={{ borderWidth: '3px' }}>
              {msg.image && (
                <img src={msg.image} alt="Uploaded" className="rounded-lg border-2 border-black mb-3 max-h-48 object-cover w-full" />
              )}
              <div className="chat-text">{renderText(msg.text)}</div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center shrink-0 bg-[#10b981] text-white shadow-[2px_2px_0px_#121212]">
              <MdSmartToy size={20} />
            </div>
            <div className="bg-white border-[3px] border-black rounded-xl px-5 py-4 shadow-[4px_4px_0px_#121212]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts — only show at beginning */}
      {messages.length <= 1 && (
        <div className="px-2 pb-3 shrink-0">
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-xs font-bold px-3 py-2 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_#121212] hover:bg-[#facc15] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-2 pb-2 shrink-0">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border-2 border-black shadow-[2px_2px_0px_#121212]" />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-[#ef4444] text-white rounded-full border-2 border-black flex items-center justify-center hover:scale-110 transition-transform"
            >
              <MdClose size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="shrink-0 px-2 pb-2">
        <div className="flex items-end gap-2 bg-white border-3 border-black rounded-xl p-2 shadow-[4px_4px_0px_#121212]" style={{ borderWidth: '3px' }}>
          {/* Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-lg bg-[#06b6d4] text-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#121212] hover:scale-105 active:translate-y-0.5 active:shadow-none transition-all"
            title="Upload image"
          >
            <MdImage size={22} />
          </button>

          {/* Text Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about recycling, upload a photo..."
            className="flex-1 resize-none border-0 outline-none text-sm font-semibold bg-transparent py-2 px-1 max-h-24 min-h-[40px] font-[inherit]"
            rows={1}
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={loading || (!input.trim() && !imageBase64)}
            className="w-10 h-10 rounded-lg bg-[#10b981] text-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#121212] hover:scale-105 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <MdSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
