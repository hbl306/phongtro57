// src/store/useSavedPosts.js
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../containers/Public/AuthContext.jsx";

const STORAGE_KEY = "pt_saved_posts_v1";

function loadAll() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// helper chuẩn hoá images của 1 post -> mảng URL string
function normalizeImages(post) {
  if (!post || !Array.isArray(post.images)) return [];
  return post.images
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter(Boolean);
}

export default function useSavedPosts() {
  const { user } = useAuth();
  const userKey = user?.id ? String(user.id) : "guest";

  const [savedPosts, setSavedPosts] = useState(() => {
    const all = loadAll();
    return Array.isArray(all[userKey]) ? all[userKey] : [];
  });

  // đổi user -> load lại list
  useEffect(() => {
    const all = loadAll();
    setSavedPosts(Array.isArray(all[userKey]) ? all[userKey] : []);
  }, [userKey]);

  const savedIds = savedPosts.map((p) => p.id);

  const isSaved = useCallback(
    (id) => {
      if (id == null) return false;
      return savedIds.includes(id);
    },
    [savedIds]
  );

  const toggleSave = useCallback(
    (post) => {
      if (!post || post.id == null) return;

      setSavedPosts((prev) => {
        const exists = prev.some((p) => p.id === post.id);
        let next;

        if (exists) {
          // Bỏ lưu
          next = prev.filter((p) => p.id !== post.id);
        } else {
          const imgs = normalizeImages(post);

          // Snapshot đầy đủ thông tin cần thiết để hiển thị lại
          const snapshot = {
            id: post.id,
            userId: post.userId,
            title: post.title,
            description: post.description || "",
            price: post.price,
            area: post.area,
            province: post.province,
            district: post.district,
            ward: post.ward,
            address: post.address,
            labelCode: post.labelCode,
            createdAt: post.createdAt,
            hasVideo:
              !!post.hasVideo ||
              (Array.isArray(post.videos) && post.videos.length > 0),
            images: imgs, // ✅ mảng URL string
            contactName: post.contactName || post.contact_name || "",
            contactPhone: post.contactPhone || post.contact_phone || "",
          };

          next = [...prev, snapshot];
        }

        const all = loadAll();
        all[userKey] = next;
        saveAll(all);

        return next;
      });
    },
    [userKey]
  );

  const clearAll = useCallback(() => {
    setSavedPosts([]);
    const all = loadAll();
    all[userKey] = [];
    saveAll(all);
  }, [userKey]);

  return {
    savedPosts,
    savedIds,
    isSaved,
    toggleSave,
    clearAll,
  };
}
