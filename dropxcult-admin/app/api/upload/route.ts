import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
    try {
        // 2. Get the file from the form
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 3. Convert file to Buffer so Cloudinary can understand it
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Upload to Cloudinary (Promise wrapper)
        const result = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: "dropxcult-products" },
                // FIX: We added ': any' here to satisfy TypeScript
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
