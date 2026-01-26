// Use environment variable if available (e.g. Vercel), otherwise default to local dynamic IP
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const REAL_API_URL = API_URL;

const realApi = {
    // Chat with Gemini
    chat: async (message) => {
        const response = await fetch(`${REAL_API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });
        if (!response.ok) throw new Error('Chat request failed');
        const data = await response.json();
        return data.response;
    },

    // Upload a captured screenshot
    upload: async (imageBlob, filename) => {
        const formData = new FormData();
        // Determine filename
        if (!filename) {
            filename = `capture_${Date.now()}.jpg`;
        }

        let file = imageBlob;
        if (typeof imageBlob === 'string') {
            try {
                // Handle both data URLs and regular URLs (http/https)
                const res = await fetch(imageBlob);
                const blob = await res.blob();
                file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            } catch (e) {
                console.error("Failed to convert image string to blob:", e);
                throw new Error("Failed to process image for upload");
            }
        }

        formData.append('file', file);

        const response = await fetch(`${REAL_API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        return await response.json();
    },

    // Get list of screenshots
    getScreenshots: async () => {
        const response = await fetch(`${REAL_API_URL}/screenshots`);
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();
        return data.map(item => ({
            ...item,
            // Ensure URL is absolute for mobile devices
            url: item.url.startsWith('http') ? item.url : `${REAL_API_URL}${item.url}`
        }));
    },

    // Delete a screenshot
    deleteScreenshot: async (filename) => {
        console.log("Deleting:", filename);
        const response = await fetch(`${REAL_API_URL}/screenshots/${filename}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Delete failed');
        return await response.json();
    },

    // Delete all screenshots
    deleteAllScreenshots: async () => {
        const response = await fetch(`${REAL_API_URL}/screenshots`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Delete all failed');
        return await response.json();
    }
};

// --- MOCK API IMPLEMENTATION (Browser Storage) ---
const mockApi = {
    chat: async (message) => {
        // Simple mock chat response
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`[MOCK] System received: "${message}". All systems normal.`);
            }, 500);
        });
    },

    upload: async (imageBlob, filename) => {
        return new Promise((resolve, reject) => {
            if (!filename) filename = `mock_capture_${Date.now()}.jpg`;

            // If it's already a string (data URL), use it. otherwise convert blob
            if (typeof imageBlob === 'string') {
                saveToStorage(imageBlob, filename);
                resolve({ url: imageBlob, filename });
                return;
            }

            // Blob to Base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                saveToStorage(base64data, filename);
                resolve({ url: base64data, filename });
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageBlob);
        });
    },

    getScreenshots: async () => {
        return new Promise(resolve => {
            const data = getFromStorage();
            // Sort by timestamp desc
            data.sort((a, b) => b.timestamp - a.timestamp);
            resolve(data);
        });
    },

    deleteScreenshot: async (filename) => {
        return new Promise(resolve => {
            removeFromStorage(filename);
            resolve({ message: "Deleted from mock storage" });
        });
    },

    deleteAllScreenshots: async () => {
        return new Promise(resolve => {
            localStorage.setItem('robot_screenshots', '[]');
            resolve({ message: "All mock screenshots deleted" });
        });
    }
};

// Helper functions for LocalStorage
const getFromStorage = () => {
    try {
        const stored = localStorage.getItem('robot_screenshots');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const saveToStorage = (base64Data, filename) => {
    const list = getFromStorage();
    const newItem = {
        filename,
        url: base64Data, // Save the whole base64 string
        timestamp: Date.now() / 1000 // unix timestamp
    };
    list.unshift(newItem); // Add to top
    // Limit to 20 to avoid filling localStorage
    if (list.length > 20) list.pop();

    localStorage.setItem('robot_screenshots', JSON.stringify(list));
};

const removeFromStorage = (filename) => {
    const list = getFromStorage();
    const newList = list.filter(item => item.filename !== filename);
    localStorage.setItem('robot_screenshots', JSON.stringify(newList));
};


// DETECT ENVIRONMENT
// Use Mock if explicit flag OR domain is vercel.app
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || window.location.hostname.includes('vercel.app');

console.log("API MODE:", USE_MOCK ? "MOCK (Browser)" : "REAL (Backend)");

export const api = USE_MOCK ? mockApi : realApi;
