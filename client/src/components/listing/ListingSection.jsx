// src/components/listing/ListingSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listPosts } from "../../services/postService";
import ListingCard from "./ListingCard";
import { useAuth } from "../../containers/Public/AuthContext.jsx";

function labelPriority(labelCode) {
  const code = (labelCode || "").toUpperCase();
  // HOT xử lý riêng ở trên, đây chỉ ưu tiên VIP
  switch (code) {
    case "VIP1":
      return 4;
    case "VIP2":
      return 3;
    case "VIP3":
      return 2;
    default:
      return 0; // không nhãn
  }
}

export default function ListingSection({ filters = {} }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // load dữ liệu
  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await listPosts(filters);
        if (!ignore) setPosts(data);
      } catch (err) {
        console.error("Lỗi tải danh sách bài đăng:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
  }, [JSON.stringify(filters)]);

  // Người cho thuê (role 1) chỉ thấy tin của mình
  const isLandlord = user?.role === 1;
  const visiblePosts = useMemo(() => {
    if (!isLandlord || !user?.id) return posts;
    return posts.filter((p) => p.userId === user.id);
  }, [posts, isLandlord, user?.id]);

  // Tách tin HOT
  const hotPosts = useMemo(
    () =>
      visiblePosts.filter(
        (p) => (p.labelCode || "").toUpperCase() === "HOT"
      ),
    [visiblePosts]
  );

  // Carousel tin HOT
  const [hotIndex, setHotIndex] = useState(0);
  useEffect(() => {
    if (!hotPosts.length) return;
    setHotIndex(0); // reset index khi danh sách HOT thay đổi

    const timer = setInterval(() => {
      setHotIndex((prev) => (prev + 1) % hotPosts.length);
    }, 10000); // 10s

    return () => clearInterval(timer);
  }, [hotPosts.length]);

  // Sắp xếp các tin còn lại theo VIP1 -> VIP2 -> VIP3 -> không nhãn
  const normalPosts = useMemo(() => {
    const nonHot = visiblePosts.filter(
      (p) => (p.labelCode || "").toUpperCase() !== "HOT"
    );

    return nonHot.slice().sort((a, b) => {
      const pa = labelPriority(a.labelCode);
      const pb = labelPriority(b.labelCode);
      if (pa !== pb) return pb - pa; // VIP1 > VIP2 > VIP3 > none

      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return db - da; // mới trước
    });
  }, [visiblePosts]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white border border-gray-200 p-4 text-gray-500">
          Đang tải danh sách bài đăng...
        </div>
      </div>
    );
  }

  if (!visiblePosts.length) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white border border-dashed border-gray-300 p-6 text-center text-gray-500">
          Hiện chưa có bài đăng nào.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Khung tin HOT nổi bật */}
      {hotPosts.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 border-b border-red-100">
            <h2 className="text-red-600 font-semibold text-sm md:text-base uppercase tracking-wide">
              Tin HOT nổi bật
            </h2>
            <span className="text-xs text-red-500">
              {hotIndex + 1}/{hotPosts.length}
            </span>
          </div>
          <div className="p-3 md:p-4">
            <ListingCard post={hotPosts[hotIndex]} variant="hot" />
          </div>
        </div>
      )}

      {/* Danh sách còn lại, đã ưu tiên VIP1 -> VIP2 -> VIP3 -> không nhãn */}
      <div className="space-y-4">
        {normalPosts.map((p) => (
          <ListingCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
