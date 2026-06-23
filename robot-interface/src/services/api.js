// api.js

// 1. Ensure the URL is consistently loaded and sanitized
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REAL_API_URL = API_URL.replace(/\/$/, ""); // Removes trailing slash if present

console.log('API_URL loaded:', REAL_API_URL);

const realApi = {
    chat: async (message, imageUrl = null) => {
        const url = `${REAL_API_URL}/chat`;
        console.log('CHAT: POST', url, { message, imageUrl });
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, image_url: imageUrl }),
            });

            // If fetch fails at network layer this will throw and be caught below
            const text = await response.text();
            let data;
            try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

            if (!response.ok) {
                console.error('CHAT RESPONSE NOT OK', response.status, data);
                throw new Error(data?.response || `Chat request failed (${response.status})`);
            }

            return data.response || data.raw || '';
        } catch (err) {
            console.error('CHAT FETCH ERROR:', err, 'url:', url);
            throw err;
        }
    },

    upload: async (imageBlob, filename) => {
        try {
            const formData = new FormData();

            if (!filename) {
                filename = `capture_${Date.now()}.jpg`;
            }

            let file;

            // Handle base64 strings or blobs
            if (typeof imageBlob === 'string' && imageBlob.startsWith('data:')) {
                // Parse the data URL directly — re-fetching data URLs can produce empty MIME types
                const [header, base64Data] = imageBlob.split(',');
                const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
                const byteString = atob(base64Data);
                const byteArray = new Uint8Array(byteString.length);
                for (let i = 0; i < byteString.length; i++) {
                    byteArray[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([byteArray], { type: mimeType });
                file = new File([blob], filename, { type: mimeType });
            } else if (typeof imageBlob === 'string') {
                const res = await fetch(imageBlob);
                const blob = await res.blob();
                file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            } else {
                file = imageBlob;
            }

            formData.append('file', file);

            // FIX: Using REAL_API_URL
            const response = await fetch(`${REAL_API_URL}/upload`, {
                method: 'POST',
                body: formData,
                // Note: Do NOT set Content-Type header manually for FormData; 
                // the browser needs to set the boundary itself.
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error("Upload server error:", errorBody);
                throw new Error('Upload failed');
            }

            const data = await response.json();

            // FIX: Return absolute URL so frontend knows the image is on Railway
            return {
                ...data,
                url: data.url.startsWith('http') ? data.url : `${REAL_API_URL}${data.url}`
            };
        } catch (err) {
            console.error("UPLOAD ERROR:", err);
            throw err;
        }
    },

    getScreenshots: async () => {
        try {
            const response = await fetch(`${REAL_API_URL}/screenshots`);

            if (!response.ok) throw new Error('Fetch failed');

            const data = await response.json();

            // Ensure every screenshot URL points to the Railway backend
            return data.map(item => ({
                ...item,
                url: item.url.startsWith('http') ? item.url : `${REAL_API_URL}${item.url}`
            }));
        } catch (err) {
            console.error("GET SCREENSHOTS ERROR:", err);
            throw err;
        }
    },

    deleteScreenshot: async (filename) => {
        const response = await fetch(`${REAL_API_URL}/screenshots/${filename}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Delete failed');

        return await response.json();
    },

    deleteAllScreenshots: async () => {
        const response = await fetch(`${REAL_API_URL}/screenshots`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Delete all failed');

        return await response.json();
    },

    getTelemetryHistory: async (limit = 100) => {
        try {
            const response = await fetch(`${REAL_API_URL}/telemetry/history?limit=${limit}`);
            if (!response.ok) throw new Error('Failed to fetch telemetry history');
            return await response.json();
        } catch (err) {
            console.error("GET TELEMETRY HISTORY ERROR:", err);
            throw err;
        }
    }
    
};



export const api = realApi;
