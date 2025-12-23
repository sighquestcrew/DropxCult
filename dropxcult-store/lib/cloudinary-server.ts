import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const getPublicIdFromUrl = (url: string) => {
    if (!url) return null;
    try {
        // Example: .../upload/v12345/folder/filename.jpg -> folder/filename
        const parts = url.split('/');
        const filename = parts.pop()?.split('.')[0];
        const folder = parts.pop();
        if (filename && folder && folder !== 'upload') { // Check if folder is part of public_id (not 'upload' or version)
            // Check for version part to safeguard
            const versionIndex = url.indexOf('/upload/');
            if (versionIndex !== -1) {
                const afterUpload = url.substring(versionIndex + 8); // Skip /upload/
                // Handle version if present (v123456789)
                const afterVersion = afterUpload.replace(/^v\d+\//, '');
                const pid = afterVersion.substring(0, afterVersion.lastIndexOf('.'));
                return pid;
            }
        }
        return null;
    } catch (e) {
        console.error("Error parsing public_id:", e);
        return null;
    }
};
