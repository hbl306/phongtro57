// src/containers/System/BookedRoomsForTenant.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../Public/AuthContext.jsx";
import bookingService from "../../services/bookingService";

const formatVND = (n = 0) =>
  (Number(n) || 0).toLocaleString("vi-VN") + "đ";

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
};

export default function BookedRoomsForTenant() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("deposit"); // 'deposit' | 'booked' | 'history'
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null); // booking đang xử lý

  // Gọi API lấy tất cả booking của user hiện tại
  useEffect(() => {
    let ignore = false;

    const fetchBookings = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError("");

        const data = await bookingService.getBookingsOfUser();

        if (!ignore) {
          setBookings(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("fetchBookings error >>>", err);
          setError(
            err?.message || "Có lỗi khi tải danh sách phòng đã đặt."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchBookings();
    return () => {
      ignore = true;
    };
  }, [user]);

  // Gom dữ liệu theo trạng thái:
  // - depositList: post.status = 'booking' & booking.status = 'pending'
  // - bookedList: post.status = 'booked' & (booking.status = 'confirmed' | 'paid')
  const { depositList, bookedList, historyList } = useMemo(() => {
    const all = Array.isArray(bookings) ? bookings : [];

    const deposit = [];
    const booked = [];

    all.forEach((b) => {
      const postStatus = b?.post?.status || b?.postStatus || "";
      const bookingStatus = b?.status || "";

      if (postStatus === "booking" && bookingStatus === "pending") {
        deposit.push(b);
      }

      if (
        postStatus === "booked" &&
        (bookingStatus === "confirmed" || bookingStatus === "paid")
      ) {
        booked.push(b);
      }
    });

    return {
      depositList: deposit,
      bookedList: booked,
      historyList: all,
    };
  }, [bookings]);

  const renderStatusBadge = (booking) => {
    const postStatus =
      booking?.post?.status || booking?.postStatus || "";
    const bookingStatus = booking?.status || "";

    let text = "";
    let cls =
      "inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ";

    if (bookingStatus === "paid") {
      text = "Đã gửi tiền cọc";
      cls += "bg-blue-50 text-blue-700 border border-blue-200";
    } else if (bookingStatus === "canceled") {
      text = "Đã hủy";
      cls += "bg-red-50 text-red-600 border border-red-200";
    } else if (bookingStatus === "expired") {
      text = "Hết hạn";
      cls += "bg-gray-100 text-gray-600 border border-gray-200";
    } else if (postStatus === "booking" && bookingStatus === "pending") {
      text = "Đang đặt cọc";
      cls += "bg-amber-50 text-amber-700 border border-amber-200";
    } else if (postStatus === "booked" && bookingStatus === "confirmed") {
      text = "Đã đặt";
      cls += "bg-emerald-50 text-emerald-700 border border-emerald-200";
    } else {
      text = "Đang xử lý";
      cls += "bg-sky-50 text-sky-700 border border-sky-200";
    }

    return <span className={cls}>{text}</span>;
  };

  const handleConfirm = async (booking) => {
    if (!booking?.id) return;
    if (
      !window.confirm(
        "Bạn xác nhận sẽ thuê phòng này? Sau khi xác nhận, đặt cọc sẽ được cố định."
      )
    ) {
      return;
    }

    try {
      setActionId(booking.id);
      const result = await bookingService.confirmBooking(booking.id);

      if (result.expired) {
        if (typeof result.balance === "number" && updateUser) {
          updateUser({ money: result.balance });
        }
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: result.bookingStatus || b.status,
                confirmedAt:
                  result.expired || !result.bookingStatus
                    ? b.confirmedAt
                    : new Date().toISOString(),
                post: {
                  ...(b.post || {}),
                  status: result.postStatus || b.post?.status,
                },
              }
            : b
        )
      );

      alert(
        result.message ||
          (result.expired
            ? "Đặt phòng đã hết hạn, tiền cọc đã được hoàn lại."
            : "Xác nhận đặt phòng thành công.")
      );
    } catch (err) {
      console.error("handleConfirm error >>>", err);
      alert(err?.message || "Xác nhận đặt phòng thất bại, vui lòng thử lại.");
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (booking) => {
    if (!booking?.id) return;
    if (
      !window.confirm(
        "Bạn chắc chắn muốn hủy đặt phòng? Hệ thống sẽ hoàn lại tiền cọc cho bạn."
      )
    ) {
      return;
    }

    try {
      setActionId(booking.id);
      const result = await bookingService.cancelBooking(booking.id);

      if (typeof result.balance === "number" && updateUser) {
        updateUser({ money: result.balance });
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: result.bookingStatus || b.status,
                post: {
                  ...(b.post || {}),
                  status: result.postStatus || b.post?.status,
                },
              }
            : b
        )
      );

      alert(
        result.message ||
          "Hủy đặt phòng thành công, hệ thống đã hoàn lại tiền cọc."
      );
    } catch (err) {
      console.error("handleCancel error >>>", err);
      alert(err?.message || "Hủy đặt phòng thất bại, vui lòng thử lại.");
    } finally {
      setActionId(null);
    }
  };

  const renderBookingItem = (booking) => {
    const post = booking.post || {};
    const thumb =
      Array.isArray(post.images) && post.images.length
        ? post.images[0].url
        : null;

    const postStatus = post.status || "";
    const canAction =
      booking.status === "pending" && postStatus === "booking";

    const isProcessing = actionId === booking.id;

    return (
      <div
        key={booking.id}
        className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-3"
      >
        {/* Ảnh phòng */}
        <div className="w-28 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {thumb ? (
            <img
              src={thumb}
              alt={post.title || "Hình phòng"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              Không có ảnh
            </div>
          )}
        </div>

        {/* Thông tin + 3 cụm số liệu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                {post.title || `Tin #${post.id}`}
              </h3>
              <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                {post.address ||
                  [
                    post.street,
                    post.ward,
                    post.district,
                    post.province,
                  ]
                    .filter(Boolean)
                    .join(", ")}
              </p>
            </div>
          </div>

          {/* 3 cụm thông tin – sát nhau hơn */}
          <div className="mt-1 grid grid-cols-3 gap-x-6 gap-y-1 text-xs">
            <div>
              <div className="text-gray-500">Giá phòng</div>
              <div className="font-medium text-emerald-600">
                {post.price ? formatVND(post.price) : "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Tiền cọc</div>
              <div className="font-semibold text-orange-600">
                {booking.depositAmount
                  ? formatVND(booking.depositAmount)
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Thời gian đặt</div>
              <div className="font-medium text-gray-800">
                {formatDateTime(booking.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Hết hạn giữ chỗ</div>
              <div className="font-medium text-gray-800">
                {formatDateTime(booking.expiresAt)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Thời gian xác nhận</div>
              <div className="font-medium text-gray-800">
                {formatDateTime(booking.confirmedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: trạng thái sát khối info, nút cách xa hơn */}
        <div className="flex items-center flex-shrink-0 pl-6">
          {/* Trạng thái – nằm ngay cạnh khối info */}
          {renderStatusBadge(booking)}

          {/* Cụm nút – lệch phải xa hơn */}
          {canAction && (
            <div className="flex flex-col gap-1 items-stretch ml-10">
              <button
                type="button"
                onClick={() => handleConfirm(booking)}
                disabled={isProcessing}
                className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {isProcessing ? "Đang xử lý..." : "Xác nhận"}
              </button>
              <button
                type="button"
                onClick={() => handleCancel(booking)}
                disabled={isProcessing}
                className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-60"
              >
                Hủy đặt phòng
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderList = (list, emptyText) => {
    if (loading) {
      return (
        <div className="py-10 text-center text-sm text-gray-500">
          Đang tải danh sách phòng bạn đã đặt...
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-10 text-center text-sm text-red-500">
          {error}
        </div>
      );
    }

    if (!list.length) {
      return (
        <div className="py-10 text-center text-sm text-gray-500">
          {emptyText}
        </div>
      );
    }

    return <div className="mt-4">{list.map(renderBookingItem)}</div>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">
          Danh sách phòng đặt cọc (dành cho người thuê trọ)
        </h1>
      </div>

      <div className="px-6 pt-4">
        <div className="inline-flex rounded-full bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("deposit")}
            className={
              "px-4 py-1.5 rounded-full transition " +
              (activeTab === "deposit"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900")
            }
          >
            Phòng đang đặt cọc
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("booked")}
            className={
              "px-4 py-1.5 rounded-full transition " +
              (activeTab === "booked"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900")
            }
          >
            Phòng đã đặt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={
              "px-4 py-1.5 rounded-full transition " +
              (activeTab === "history"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900")
            }
          >
            Lịch sử đặt phòng
          </button>
        </div>
      </div>

      <div className="px-6 pb-6 flex-1 overflow-auto">
        {activeTab === "deposit" &&
          renderList(
            depositList,
            "Bạn chưa có phòng nào đang đặt cọc."
          )}

        {activeTab === "booked" &&
          renderList(
            bookedList,
            "Bạn chưa có phòng trọ nào đã đặt."
          )}

        {activeTab === "history" &&
          renderList(
            historyList,
            "Bạn chưa có lịch sử đặt phòng nào."
          )}
      </div>
    </div>
  );
}
