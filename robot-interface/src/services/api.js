const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('API_URL loaded:', API_URL);
const REAL_API_URL = API_URL;

const realApi = {
    chat: async (message, imageUrl = null) => {
        try {
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
        const formData = new FormData();

        if (!filename) {
            filename = `capture_${Date.now()}.jpg`;
        }

        let file = imageBlob;

        if (typeof imageBlob === 'string') {
            const res = await fetch(imageBlob);
            const blob = await res.blob();
            file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
        }

        formData.append('file', file);

        const response = await fetch(`${REAL_API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        return await response.json();
    },

    getScreenshots: async () => {
        const response = await fetch(`${REAL_API_URL}/screenshots`);

        if (!response.ok) throw new Error('Fetch failed');

        const data = await response.json();

        return data.map(item => ({
            ...item,
            url: item.url.startsWith('http') ? item.url : `${REAL_API_URL}${item.url}`
        }));
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

// Toggle mock

export const api = realApi;
