// src/containers/System/SavedPosts.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Public/AuthContext.jsx";
import useSavedPosts from "../../store/useSavedPosts.js";
import ListingCard from "../../components/listing/ListingCard.jsx";

export default function SavedPosts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedPosts, clearAll } = useSavedPosts();

  useEffect(() => {
    if (!user) {
      navigate("/dang-nhap-tai-khoan", { replace: true });
      return;
    }
    if (Number(user.role) !== 0) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Tin đã lưu
          </h1>
          <p className="text-xs text-gray-500">
            Những tin bạn đã bấm trái tim khi duyệt danh sách.
          </p>
        </div>
        {savedPosts.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            Xoá tất cả
          </button>
        )}
      </div>

      <div className="px-6 py-6 flex-1 overflow-auto bg-[#f5f5f7]">
        {savedPosts.length === 0 ? (
          <p className="text-sm text-gray-600">
            Bạn chưa lưu tin nào. Hãy bấm trái tim ở mỗi tin để lưu lại.
          </p>
        ) : (
          <div className="space-y-4 max-w-[900px]">
            {savedPosts.map((p) => (
              <ListingCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
