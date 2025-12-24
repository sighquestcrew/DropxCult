import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary-server";
import jwt from "jsonwebtoken";
import { uploadLimiter, getClientIp, checkRateLimit } from "@/lib/redis";

// ✅ SECURITY: Allowed file types
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
    try {
        // ✅ SECURITY: Redis Rate Limiting (10 uploads per hour)
        const ip = getClientIp(req);
        const { limited, headers, reset } = await checkRateLimit(uploadLimiter, ip);

        if (limited) {
            const retryAfter = Math.ceil((reset - Date.now()) / 1000);
            return new NextResponse(
                JSON.stringify({
                    error: "Upload limit exceeded. Please try again later.",
                    retryAfter: `${retryAfter} seconds`
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "Retry-After": retryAfter.toString(),
                        ...headers
                    }
                }
            );
        }

        // ✅ SECURITY FIX: Require authentication
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        try {
            jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // 2. Get the file from the form
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // ✅ SECURITY FIX: Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: "Invalid file type. Only images (JPEG, PNG, WebP, GIF) allowed."
            }, { status: 400 });
        }

        // ✅ SECURITY FIX: Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: "File too large. Maximum 5MB allowed."
            }, { status: 413 });
        }

        // ✅ SECURITY FIX: Sanitize filename
        const sanitizedFilename = file.name
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .substring(0, 100);

        // 3. Convert file to Buffer so Cloudinary can understand it
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Upload to Cloudinary with security constraints
        const result = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "dropxcult-products",
                    resource_type: "image",
                    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
                    max_bytes: MAX_FILE_SIZE,
                    public_id: sanitizedFilename
                },
                (error: any, result: any) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            ).end(buffer);
        });

        return NextResponse.json({
            url: result.secure_url,
            public_id: result.public_id
        });
    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        // ✅ SECURITY FIX: Require authentication
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        try {
            jwt.verify(token, process.env.NEXTAUTH_SECRET!);
        } catch {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const { public_id } = await req.json();

        if (!public_id) {
            return NextResponse.json({ error: "Missing public_id" }, { status: 400 });
        }

        const result = await cloudinary.uploader.destroy(public_id);

        return NextResponse.json({ message: "Image deleted", result });

    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
