import React, { useState } from "react";
import { nhost } from "../../lib/nhost";

const PostUpload = () => {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image to upload");
      return;
    }

    setUploading(true);
    try {
      // Step 1️⃣ — Upload image to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "posts_upload");

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/dn7cpjfyz/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await uploadResponse.json();
      if (!data.secure_url) throw new Error("Upload failed");

      console.log("✅ Uploaded to Cloudinary:", data.secure_url);

      // Step 2️⃣ — Get logged-in user from Nhost
      const user = await nhost.auth.getUser();
      if (!user?.body?.id) throw new Error("User not logged in");
      const user_id = user.body.id;

      // Step 3️⃣ — Insert into Hasura (posts table)
      const mutation = `
        mutation InsertPost($author_id: uuid!, $caption: String!, $image_url: String!) {
          insert_posts_one(object: {
            author_id: $author_id,
            caption: $caption,
            image_url: $image_url,
            is_reel: false
          }) {
            id
            caption
            image_url
            created_at
          }
        }
      `;

      const { data: result, error } = await nhost.graphql.request(mutation, {
        author_id: user_id,
        caption,
        image_url: data.secure_url,
      });

      if (error) throw error;
      console.log("✅ Post saved:", result);
      alert("Post uploaded successfully!");

      // Reset form
      setCaption("");
      setFile(null);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-xl font-semibold mb-4 text-center">Create a Post</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-3"
      />
      <textarea
        placeholder="Write a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        {uploading ? "Uploading..." : "Upload Post"}
      </button>
    </div>
  );
};

export default PostUpload;