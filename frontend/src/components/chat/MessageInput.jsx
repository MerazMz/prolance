import { useState, useRef, useEffect } from 'react';
import { HiOutlinePaperAirplane, HiOutlinePaperClip, HiOutlineMicrophone } from 'react-icons/hi';
import socketService from '../../services/socketService';
import ToneIndicator from './ToneIndicator';
import { analyzeMessageTone } from '../../services/aiChatService';

export default function MessageInput({ conversationId }) {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [toneAnalysis, setToneAnalysis] = useState(null);
    const [analyzingTone, setAnalyzingTone] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const typingTimeoutRef = useRef(null);
    const toneTimeoutRef = useRef(null);
    const textareaRef = useRef(null);
    const recognitionRef = useRef(null);

    const handleTyping = (value) => {
        setMessage(value);

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }

        // Emit typing indicator
        socketService.emitTyping(conversationId, true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 1 second of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            socketService.emitTyping(conversationId, false);
        }, 1000);

        // Debounced tone analysis - only for messages 20+ chars
        if (value.trim().length >= 20) {
            if (toneTimeoutRef.current) {
                clearTimeout(toneTimeoutRef.current);
            }

            toneTimeoutRef.current = setTimeout(async () => {
                setAnalyzingTone(true);
                try {
                    const result = await analyzeMessageTone(value.trim());
                    if (result.success) {
                        setToneAnalysis(result.analysis);
                    }
                } catch (error) {
                    // Silently fail - tone analysis is optional
                    console.error('Tone analysis failed:', error);
                    setToneAnalysis(null);
                } finally {
                    setAnalyzingTone(false);
                }
            }, 2000); // 2 second debounce
        } else {
            setToneAnalysis(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message.trim() || sending) return;

        setSending(true);
        socketService.emitTyping(conversationId, false);
        setToneAnalysis(null); // Clear tone on send

        try {
            socketService.sendMessage(conversationId, message.trim());
            setMessage('');

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Voice-to-Text Handler
    const handleVoiceRecording = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (isRecording) {
            // Stop recording
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
            return;
        }

        // Start recording
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update message with final transcript
            if (finalTranscript) {
                const newMessage = message + finalTranscript;
                setMessage(newMessage);
                handleTyping(newMessage);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);

            if (event.error === 'no-speech') {
                console.log('No speech detected');
            } else if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please enable microphone permissions.');
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    // Cleanup timeouts and speech recognition
    useEffect(() => {
        // Listen for smart reply insertion
        const handleInsertReply = (event) => {
            setMessage(event.detail);
            // Focus the textarea
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        };

        window.addEventListener('insertSmartReply', handleInsertReply);

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (toneTimeoutRef.current) clearTimeout(toneTimeoutRef.current);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            window.removeEventListener('insertSmartReply', handleInsertReply);
        };
    }, []);

    return (
        <div>
            {/* Tone Indicator */}
            {toneAnalysis && (
                <ToneIndicator
                    tone={toneAnalysis.tone}
                    confidence={toneAnalysis.confidence}
                    isProblematic={toneAnalysis.isProblematic}
                    suggestion={toneAnalysis.suggestion}
                />
            )}

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="px-6 mt-4 p-2 ">
                <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => handleTyping(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:border-green-500 dark:focus:border-green-500 focus:outline-none resize-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            rows={1}
                            style={{
                                maxHeight: '120px',
                                overflow: 'auto'
                            }}
                        />
                    </div>

                    {/* Voice-to-Text Button */}
                    <button
                        type="button"
                        onClick={handleVoiceRecording}
                        className={`p-3 rounded-xl transition shadow-sm ${isRecording
                                ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        title={isRecording ? 'Stop recording' : 'Start voice input'}
                    >
                        <HiOutlineMicrophone size={18} />
                    </button>

                    <button
                        type="submit"
                        disabled={!message.trim() || sending}
                        className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-sm"
                        title="Send message"
                    >
                        <HiOutlinePaperAirplane size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}

