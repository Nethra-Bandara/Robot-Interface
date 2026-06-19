import React from 'react';

import { SmartToy, Send, KeyboardArrowDown, DeleteSweep } from '@mui/icons-material';
import { IconButton, Box, Fab } from '@mui/material';

const ChatWindow = ({ activeContext, theme }) => {
    const [input, setInput] = React.useState('');
    const [messages, setMessages] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showScrollButton, setShowScrollButton] = React.useState(false);

    // Update initial message when context changes
    React.useEffect(() => {
        if (activeContext) {
            setMessages(prev => [
                ...prev,
                {
                    text: `Analyzing capture from ${activeContext.timestamp}... Looks like common foliage, checking for camouflage.`,
                    isBot: true,
                    image: activeContext.url // Add image url to message
                }
            ]);
        }
    }, [activeContext]);

    // Auto-scroll to bottom
    const messagesEndRef = React.useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
    };
    React.useEffect(scrollToBottom, [messages]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Show button if we are more than 100px away from bottom
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        setShowScrollButton(distanceToBottom > 100);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');

        // Add user message
        setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
        setIsLoading(true);

        try {
            // Use backend API
            const { api } = await import('../services/api');
            const response = await api.chat(userMessage, activeContext?.url);

            setMessages(prev => [...prev, { text: response, isBot: true }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { text: "Connection error. Please try again.", isBot: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setMessages([]);
    };

    return (
    <div className="chat-window" style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
    }}>
        {/* Chat Header/Tools — pinned, never shrinks */}
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mb: 1, 
            flexShrink: 0,
            borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            pb: 0.5
        }}>
            <IconButton 
                size="small" 
                onClick={handleClear} 
                title="Clear Chat History"
                sx={{ 
                    color: theme === 'dark' ? '#ff3d00' : '#d32f2f',
                    '&:hover': {
                        backgroundColor: theme === 'dark' ? 'rgba(255, 61, 0, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                    }
                }}
            >
                <DeleteSweep fontSize="small" />
            </IconButton>
        </Box>

        {/* Messages — the ONLY thing that grows/scrolls */}
        <div
            className="messages"
            onScroll={handleScroll}
            style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
        >
            {messages.map((msg, index) => (
                <div key={index} className={msg.isBot ? "bot-msg" : "user-msg"} style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '15px',
                    justifyContent: msg.isBot ? 'flex-start' : 'flex-end'
                }}>
                    {msg.isBot && <SmartToy sx={{ color: '#4caf50', mt: 0.5 }} />}
                    <div style={{
                        backgroundColor: msg.isBot ? 'transparent' : (theme === 'dark' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(46, 125, 50, 0.15)'),
                        color: theme === 'dark' ? '#fff' : '#0a1c12',
                        padding: msg.isBot ? '0' : '10px 15px',
                        borderRadius: '10px',
                        maxWidth: '80%',
                        border: msg.isBot ? 'none' : `1px solid ${theme === 'dark' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(46, 125, 50, 0.3)'}`
                    }}>
                        {msg.isBot && <strong>Assistant: </strong>}
                        {msg.image && (
                            <Box sx={{ mb: 1, mt: 1 }}>
                                <img
                                    src={msg.image}
                                    alt="Captured context"
                                    style={{
                                        width: '40px', height: '40px', objectFit: 'cover',
                                        borderRadius: '4px',
                                        border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.2)' : '#1a3324'}`
                                    }}
                                />
                            </Box>
                        )}
                        {msg.text}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div style={{ display: 'flex', gap: '10px', color: theme === 'dark' ? '#aaa' : '#555', fontStyle: 'italic', paddingLeft: '34px' }}>
                    <div>Analyzing...</div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
            <Box sx={{ position: 'absolute', bottom: '70px', left: '20px', zIndex: 10 }}>
                <Fab
                    size="small" color="primary" aria-label="scroll down" onClick={scrollToBottom}
                    sx={{ 
                        backgroundColor: theme === 'dark' ? 'rgba(0, 255, 136, 0.8)' : 'rgba(46, 125, 50, 0.8)',
                        color: theme === 'dark' ? '#000' : '#fff',
                        '&:hover': { backgroundColor: '#00ff88', color: '#000', boxShadow: '0 0 15px rgba(0, 255, 136, 0.5)' } 
                    }}
                >
                    <KeyboardArrowDown />
                </Fab>
            </Box>
        )}

        {/* Input row — pinned, never shrinks, always reachable */}
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 1,
            flexShrink: 0,
            bgcolor: theme === 'dark' ? '#000' : '#fff',
            borderRadius: 1,
            border: `1px solid ${theme === 'dark' ? '#444' : '#1a3324'}`,
            pr: 1,
            boxShadow: theme === 'dark' ? 'none' : '0 2px 6px rgba(0,0,0,0.1)'
        }}>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={activeContext ? "Ask about this capture..." : "Ask about the detected species..."}
                aria-label="Chat input"
                style={{
                    border: 'none', outline: 'none', background: 'transparent', flexGrow: 1,
                    color: theme === 'dark' ? 'white' : '#0a1c12', padding: '12px', margin: 0,
                    transition: 'background-color 0.25s ease'
                }}
                disabled={isLoading}
            />
            <IconButton
                size="small"
                sx={{ 
                    color: isLoading ? (theme === 'dark' ? '#444' : '#ccc') : (theme === 'dark' ? '#00ff88' : '#2e7d32'),
                    p: '8px', transition: 'all 0.2s', opacity: isLoading ? 0.6 : 1,
                    pointerEvents: isLoading ? 'none' : 'auto',
                    '&:hover': {
                        backgroundColor: isLoading ? 'transparent' : '#00ff88',
                        color: isLoading ? 'inherit' : '#000', borderRadius: '4px'
                    }
                }}
                onClick={handleSend}
                disabled={isLoading}
            >
                <Send />
            </IconButton>
        </Box>
        
    </div>
);
};

export default ChatWindow;
