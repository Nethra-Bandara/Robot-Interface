// Use environment variable if available (e.g. Vercel), otherwise default to local dynamic IP
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

export const api = {
    // Chat with Gemini
    chat: async (message) => {
        const response = await fetch(`${API_URL}/chat`, {
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

        // Convert base64/blob to file if needed or assume logic happens before
        // Here we assume imageBlob is actually a Blob or File object.
        // If it's a data URL (string), we need to convert it.

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

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        return await response.json();
    },

    // Get list of screenshots
    getScreenshots: async () => {
        const response = await fetch(`${API_URL}/screenshots`);
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();
        return data.map(item => ({
            ...item,
            // Ensure URL is absolute for mobile devices
            url: item.url.startsWith('http') ? item.url : `${API_URL}${item.url}`
        }));
    },

    // Delete a screenshot
    deleteScreenshot: async (filename) => {
        console.log("Deleting:", filename);
        const response = await fetch(`${API_URL}/screenshots/${filename}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Delete failed');
        return await response.json();
    },

    // Delete all screenshots
    deleteAllScreenshots: async () => {
        const response = await fetch(`${API_URL}/screenshots`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Delete all failed');
        return await response.json();
    }
};
