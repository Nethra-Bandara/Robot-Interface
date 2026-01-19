import React from 'react';

import { SmartToy, Send, KeyboardArrowDown } from '@mui/icons-material';
import { IconButton, Box, Fab } from '@mui/material';

const ChatWindow = ({ activeContext }) => {
    const [input, setInput] = React.useState('');
    const [messages, setMessages] = React.useState([
        {
            text: "Panthera Pardus Kotiya (Sri Lankan Leopard) detected near your waypoint.",
            isBot: true,
            isContext: true // Special flag for initial context message
        }
    ]);
    const [isLoading, setIsLoading] = React.useState(false);

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
    };
    React.useEffect(scrollToBottom, [messages]);

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
            const response = await api.chat(userMessage);

            setMessages(prev => [...prev, { text: response, isBot: true }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { text: "Connection error. Please try again.", isBot: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-window">
            <div className="messages" style={{ overflowY: 'auto', maxHeight: 'calc(100% - 60px)' }}>
                {messages.map((msg, index) => (
                    <div key={index} className={msg.isBot ? "bot-msg" : "user-msg"} style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '15px',
                        justifyContent: msg.isBot ? 'flex-start' : 'flex-end'
                    }}>
                        {msg.isBot && <SmartToy sx={{ color: '#4caf50', mt: 0.5 }} />}

                        <div style={{
                            backgroundColor: msg.isBot ? 'transparent' : 'rgba(76, 175, 80, 0.2)',
                            padding: msg.isBot ? '0' : '10px 15px',
                            borderRadius: '10px',
                            maxWidth: '80%'
                        }}>
                            {msg.isBot && <strong>Assistant: </strong>}
                            {msg.image && (
                                <Box sx={{ mb: 1, mt: 1 }}>
                                    <img
                                        src={msg.image}
                                        alt="Captured context"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                    />
                                </Box>
                            )}
                            {msg.text}

                            {msg.isContext && !activeContext && (
                                <>
                                    <br /><br />
                                    <em>Note: GPS accuracy may vary under the canopy.</em>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ display: 'flex', gap: '10px', color: '#888', fontStyle: 'italic' }}>
                        <SmartToy sx={{ color: '#666', mt: 0.5 }} />
                        <div>Analyzing...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            <Box sx={{ position: 'absolute', bottom: '80px', right: '20px', zIndex: 10 }}>
                <Fab
                    size="small"
                    color="primary"
                    aria-label="scroll down"
                    onClick={scrollToBottom}
                    sx={{ backgroundColor: 'rgba(255, 152, 0, 0.8)', '&:hover': { backgroundColor: '#f57c00' } }}
                >
                    <KeyboardArrowDown />
                </Fab>
            </Box>

            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 1,
                bgcolor: '#000',
                borderRadius: 1,
                border: '1px solid #444',
                pr: 1
            }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={activeContext ? "Ask about this capture..." : "Ask about the detected species..."}
                    style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        flexGrow: 1,
                        color: 'white',
                        padding: '12px',
                        margin: 0
                    }}
                    disabled={isLoading}
                />
                <IconButton
                    size="small"
                    sx={{ color: isLoading ? '#666' : '#ff9800' }}
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
