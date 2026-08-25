import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Pill,
  MapPin,
  HeartPulse,
} from "lucide-react";
import { Language, ChatMessage } from "../types.ts";
import { translations } from "../translations.ts";

interface AiAssistantProps {
  language: Language;
  highContrast: boolean;
  onNavigate: (view: "home" | "scanner" | "pharmacy" | "emergency" | "assistant") => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  language,
  highContrast,
  onNavigate,
}) => {
  const t = translations[language];

  const [inputMessage, setInputMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text:
        language === "hi"
          ? "नमस्ते! मैं केयरमित्र (CareMitra) का स्वास्थ्य एवं दवा साथी हूँ। आप मुझसे दवाओं की सामान्य जानकारी, नज़दीकी अस्पताल या इमरजेंसी सहायता के बारे में पूछ सकते हैं।"
          : "Hello! I am your CareMitra Health & Medicine companion. You can ask me general questions about reading your medicine labels, finding nearby emergency hospitals, or sharing your location with family.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle Speech Recognition for Elderly Users
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === "hi" ? "hi-IN" : "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert(
        language === "hi"
          ? "आपके ब्राउज़र में बोलकर इनपुट की सुविधा समर्थित नहीं है।"
          : "Voice speech recognition is not supported in this browser."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-US";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting speech recognition", e);
      }
    }
  };

  // Text-To-Speech for Message
  const speakMessage = (msgId: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";

    utterance.onstart = () => setSpeakingMessageId(msgId);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get assistant reply");
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      // Optional voice read for seniors
      speakMessage(assistantMsg.id, data.reply);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text:
          language === "hi"
            ? "माफ़ कीजिए, मुझे उत्तर प्राप्त करने में समस्या आई। यदि आपात स्थिति है तो कृपया तुरंत 112 पर कॉल करें।"
            : "I'm sorry, I could not process your query right now. If this is an emergency, please call 112 directly.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div id="ai-assistant-section" className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight">
          {t.assistantTitle}
        </h2>
        <p className={`text-base sm:text-lg max-w-2xl mx-auto ${highContrast ? "text-yellow-200" : "text-slate-600"}`}>
          {t.assistantSubtitle}
        </p>
      </div>

      {/* Safety Guardrail Notice Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 dark:bg-neutral-900 border-2 border-blue-100 dark:border-neutral-800 text-xs sm:text-sm flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-slate-700 dark:text-neutral-300 leading-relaxed font-medium">
          {t.assistantDisclaimer}
        </p>
      </div>

      {/* Suggested Quick Questions */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block">
          {t.sampleQuestions}
        </span>
        <div className="flex flex-wrap gap-2">
          {[t.q1, t.q2, t.q3, t.q4].map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuestion(q)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all text-left shadow-xs hover:border-blue-600 ${
                highContrast
                  ? "bg-neutral-900 border-yellow-400 text-yellow-300 hover:bg-neutral-800"
                  : "bg-white border-slate-200 text-slate-800 hover:bg-blue-50/50"
              }`}
            >
              💬 {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        className={`rounded-[20px] p-4 sm:p-6 border-2 shadow-xs min-h-[360px] max-h-[480px] overflow-y-auto space-y-4 ${
          highContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 ${
                msg.sender === "user"
                  ? highContrast
                    ? "bg-yellow-400 text-black font-bold"
                    : "bg-blue-600 text-white rounded-br-xs"
                  : highContrast
                  ? "bg-neutral-900 border-2 border-yellow-400 text-yellow-200 rounded-bl-xs"
                  : "bg-slate-50 text-slate-900 rounded-bl-xs border-2 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs opacity-80 mb-1">
                <span className="font-extrabold uppercase">
                  {msg.sender === "user" ? (language === "hi" ? "आप" : "You") : "CareMitra"}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              <p className="text-base sm:text-lg leading-relaxed font-medium whitespace-pre-wrap">
                {msg.text}
              </p>

              {/* Audio Playback Button on Assistant Messages */}
              {msg.sender === "assistant" && (
                <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-neutral-800">
                  <button
                    onClick={() => speakMessage(msg.id, msg.text)}
                    className="text-xs font-bold flex items-center gap-1.5 opacity-90 hover:opacity-100 py-1"
                  >
                    {speakingMessageId === msg.id ? (
                      <>
                        <VolumeX className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>{t.stopVoiceBtn}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-blue-600 dark:text-yellow-400" />
                        <span>{language === "hi" ? "आवाज़ में सुनें" : "Read Aloud"}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 max-w-xs animate-pulse">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            <span className="text-xs font-medium text-slate-500">
              {language === "hi" ? "केयरमित्र उत्तर तैयार कर रहा है..." : "CareMitra is thinking..."}
            </span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box & Voice Button */}
      <div
        className={`rounded-2xl border-2 p-2 shadow-xs flex items-center gap-2 ${
          highContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-white border-slate-300 focus-within:border-blue-600"
        }`}
      >
        {/* Voice Input Button */}
        <button
          id="btn-voice-input-mic"
          type="button"
          onClick={toggleSpeechRecognition}
          className={`p-3.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
            isListening
              ? "bg-red-600 text-white animate-ping"
              : highContrast
              ? "bg-neutral-800 text-yellow-300 hover:bg-neutral-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
          }`}
          title={t.speakBtn}
          aria-label={t.speakBtn}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Text Input */}
        <input
          id="input-assistant-query"
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={isListening ? t.listening : t.askPlaceholder}
          className="w-full px-3 py-3 text-base sm:text-lg font-medium bg-transparent focus:outline-none placeholder:text-slate-400"
        />

        {/* Send Button */}
        <button
          id="btn-send-assistant-message"
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          className={`py-3.5 px-6 rounded-xl font-bold text-base flex items-center gap-2 shadow-xs shrink-0 disabled:opacity-30 transition-all ${
            highContrast
              ? "bg-yellow-400 text-black hover:bg-yellow-300"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <span>{t.sendBtn}</span>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
