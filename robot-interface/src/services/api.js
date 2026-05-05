// api.js

// 1. Ensure the URL is consistently loaded and sanitized
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REAL_API_URL = API_URL.replace(/\/$/, ""); // Removes trailing slash if present

console.log('API_URL loaded:', REAL_API_URL);

const realApi = {
    chat: async (message, imageUrl = null) => {
        try {
            // FIX: Using REAL_API_URL instead of the raw import.meta.env
            const response = await fetch(`${REAL_API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, image_url: imageUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.response || 'Chat request failed');
            }

            return data.response;
        } catch (err) {
            console.error("CHAT ERROR:", err);
            throw err;
        }
    },

    upload: async (imageBlob, filename) => {
        try {
            const formData = new FormData();

            if (!filename) {
                filename = `capture_${Date.now()}.jpg`;
            }

            let file = imageBlob;

            // Handle base64 strings or blobs
            if (typeof imageBlob === 'string' && imageBlob.startsWith('data:')) {
                const res = await fetch(imageBlob);
                const blob = await res.blob();
                file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            }

            formData.append('file', file);

            // FIX: Using REAL_API_URL
            const response = await fetch(`${REAL_API_URL}/upload`, {
                method: 'POST',
                // Note: Do NOT set Content-Type header manually for FormData; 
                // the browser needs to set the boundary itself.
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
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
    }
};

export const api = realApi;
