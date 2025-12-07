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

export default function BookedRoomsForLandlord() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'confirmed' | 'paid' | 'history'
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  // Lấy tất cả booking của các phòng mà mình là chủ bài
  useEffect(() => {
    let ignore = false;

    const fetchBookings = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError("");

        const data = await bookingService.getBookingsOfLandlord();

        if (!ignore) {
          setBookings(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          console.error("fetch landlord bookings error >>>", err);
          setError(
            err?.message ||
              "Có lỗi khi tải danh sách phòng được khách đặt."
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

  // Nhóm theo trạng thái:
  // - pendingList: post.status = 'booking' & booking.status = 'pending'
  // - confirmedList: post.status = 'booked' & booking.status = 'confirmed'
  // - paidList: post.status = 'booked' & booking.status = 'paid'
  const { pendingList, confirmedList, paidList, historyList } = useMemo(() => {
    const all = Array.isArray(bookings) ? bookings : [];

    const pending = [];
    const confirmed = [];
    const paid = [];

    all.forEach((b) => {
      const postStatus = b?.post?.status || "";
      const bookingStatus = b?.status || "";

      if (postStatus === "booking" && bookingStatus === "pending") {
        pending.push(b);
      }
      if (postStatus === "booked" && bookingStatus === "confirmed") {
        confirmed.push(b);
      }
      if (postStatus === "booked" && bookingStatus === "paid") {
        paid.push(b);
      }
    });

    return {
      pendingList: pending,
      confirmedList: confirmed,
      paidList: paid,
      historyList: all,
    };
  }, [bookings]);

  const renderStatusBadge = (booking) => {
    const postStatus = booking?.post?.status || "";
    const bookingStatus = booking?.status || "";

    let text = "";
    let cls =
      "inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ";

    if (postStatus === "booking" && bookingStatus === "pending") {
      text = "Đang được đặt cọc";
      cls += "bg-amber-50 text-amber-700 border border-amber-200";
    } else if (postStatus === "booked" && bookingStatus === "confirmed") {
      text = "Đã được xác nhận";
      cls += "bg-emerald-50 text-emerald-700 border border-emerald-200";
    } else if (postStatus === "booked" && bookingStatus === "paid") {
      text = "Đã gửi tiền cọc";
      cls += "bg-blue-50 text-blue-700 border border-blue-200";
    } else if (bookingStatus === "expired") {
      text = "Hết hạn";
      cls += "bg-gray-100 text-gray-600 border border-gray-200";
    } else if (bookingStatus === "canceled") {
      text = "Đã hủy";
      cls += "bg-red-50 text-red-600 border border-red-200";
    } else if (bookingStatus === "pending") {
      text = "Đang chờ xử lý";
      cls += "bg-sky-50 text-sky-700 border border-sky-200";
    } else {
      text = "Khác";
      cls += "bg-gray-50 text-gray-600 border border-gray-200";
    }

    return <span className={cls}>{text}</span>;
  };

  const renderBookingItem = (booking) => {
    const post = booking.post || {};
    const thumb =
      Array.isArray(post.images) && post.images.length
        ? post.images[0].url
        : null;

    const tenantName =
      booking.tenantName ||
      booking.tenant?.name ||
      booking.user?.name ||
      "Khách thuê";
    const tenantPhone =
      booking.tenantPhone ||
      booking.tenant?.phone ||
      booking.user?.phone ||
      "";

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
            <p className="mt-1 text-xs text-gray-600">
              Người thuê: <b>{tenantName}</b>
              {tenantPhone && (
                <>
                  {" "}
                  • <span className="font-medium">{tenantPhone}</span>
                </>
              )}
            </p>
          </div>

          {/* 3 block thông tin – sát nhau hơn */}
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
              <div className="text-gray-500">Thời gian khách đặt</div>
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

        {/* Cột phải – chỉ có trạng thái, căn giữa card */}
        <div className="flex items-center flex-shrink-0 pl-6">
          {renderStatusBadge(booking)}
        </div>
      </div>
    );
  };

  const renderList = (list, emptyText) => {
    if (loading) {
      return (
        <div className="py-10 text-center text-sm text-gray-500">
          Đang tải danh sách phòng được khách đặt...
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
          Phòng được đặt cọc (dành cho người cho thuê)
        </h1>
      </div>

      <div className="px-6 pt-4">
        <div className="inline-flex rounded-full bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={
              "px-4 py-1.5 rounded-full transition " +
              (activeTab === "pending"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900")
            }
          >
            Phòng đang được đặt cọc
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("confirmed")}
            className={
              "px-4 py-1.5 rounded-full transition " +
              (activeTab === "confirmed"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900")
            }
          >
            Phòng đã được xác nhận
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paid")}
            className={
              "px-4 py-1.5 rounded-full transition " +
              (activeTab === "paid"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900")
            }
          >
            Phòng đã gửi tiền cọc
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
        {activeTab === "pending" &&
          renderList(
            pendingList,
            "Hiện chưa có phòng nào đang được khách đặt cọc."
          )}

        {activeTab === "confirmed" &&
          renderList(
            confirmedList,
            "Chưa có phòng nào được xác nhận đặt."
          )}

        {activeTab === "paid" &&
          renderList(
            paidList,
            "Chưa có phòng nào đã được gửi tiền cọc."
          )}

        {activeTab === "history" &&
          renderList(
            historyList,
            "Bạn chưa có lịch sử phòng được đặt nào."
          )}
      </div>
    </div>
  );
}
