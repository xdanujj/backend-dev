import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    console.log("📤 Uploading:", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // ✅ DELETE LOCAL FILE AFTER SUCCESS
    await fs.unlink(localFilePath);

    console.log("🗑️ Local file deleted:", localFilePath);

    return response;
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error.message);

    // ✅ DELETE LOCAL FILE EVEN IF UPLOAD FAILS
    try {
      await fs.unlink(localFilePath);
      console.log("🗑️ Local file deleted after failure:", localFilePath);
    } catch (err) {
      console.error("⚠️ Failed to delete local file:", err.message);
    }

    return null;
  }
};

export { uploadOnCloudinary };
