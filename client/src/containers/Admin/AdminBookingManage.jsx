// src/containers/Admin/AdminBookingManage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Public/AuthContext.jsx";
import bookingService from "../../services/bookingService";
import AdminPageLayout from "./AdminPageLayout.jsx";

const TABS = [
  { key: "deposit", label: "Phòng đang được đặt cọc" },
  { key: "confirmed", label: "Phòng đã được xác nhận" },
];

const formatVND = (n = 0) => (Number(n) || 0).toLocaleString("vi-VN") + "đ";

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
};

export default function AdminBookingManage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("deposit");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  // Nếu không phải admin thì quay về /
  useEffect(() => {
    if (!user || Number(user.role) !== 2) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Gọi API lấy danh sách booking cho admin
  useEffect(() => {
    let ignore = false;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setErr("");

        const data = await bookingService.adminGetAllBookings();
        if (!ignore) setBookings(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) {
          console.error("fetch admin bookings error >>>", e);
          setErr(e.message || "Không tải được danh sách phòng đặt.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      ignore = true;
    };
  }, []);

  // Phân loại: deposit / confirmed+paid
  const { depositList, confirmedAndPaidList } = useMemo(() => {
    const all = Array.isArray(bookings) ? bookings : [];
    const deposit = [];
    const confirmed = [];
    const paid = [];

    all.forEach((b) => {
      const postStatus = b?.post?.status || b.postStatus || "";
      const bookingStatus = b?.status || "";

      if (postStatus === "booking" && bookingStatus === "pending") deposit.push(b);
      if (postStatus === "booked" && bookingStatus === "confirmed") confirmed.push(b);
      if (postStatus === "booked" && bookingStatus === "paid") paid.push(b);
    });

    return {
      depositList: deposit,
      confirmedAndPaidList: [...confirmed, ...paid],
    };
  }, [bookings]);

  // Lọc danh sách đã xác nhận theo số điện thoại người thuê
  const filteredConfirmedAndPaidList = useMemo(() => {
    const kw = searchPhone.replace(/\D/g, "").trim();
    if (!kw) return confirmedAndPaidList;

    return confirmedAndPaidList.filter((b) => {
      const phone = (b?.tenant?.phone || "").replace(/\D/g, "");
      return phone.includes(kw);
    });
  }, [confirmedAndPaidList, searchPhone]);

  const renderStatusBadge = (booking) => {
    const postStatus = booking?.post?.status || booking.postStatus || "";
    const bookingStatus = booking?.status || "";

    let text = "";
    let cls =
      "inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ";

    if (postStatus === "booking" && bookingStatus === "pending") {
      text = "Đang đặt cọc";
      cls += "bg-amber-50 text-amber-700 border border-amber-200";
    } else if (postStatus === "booked" && bookingStatus === "confirmed") {
      text = "Đã xác nhận";
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
    } else {
      text = "Khác";
      cls += "bg-gray-50 text-gray-600 border border-gray-200";
    }

    return <span className={cls}>{text}</span>;
  };

  const getThumbUrl = (post) => {
    const imgs = post?.images;
    if (!Array.isArray(imgs) || imgs.length === 0) return null;

    const first = imgs[0];
    // hỗ trợ cả dạng: { url } và dạng: "filename.jpg" / "http..."
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first.url || first.path || null;
    return null;
  };

  const renderBookingItem = (booking, { showSendDeposit } = {}) => {
    const post = booking.post || {};
    const tenant = booking.tenant || {};
    const thumb = getThumbUrl(post);

    const canSendDeposit = showSendDeposit && booking.status === "confirmed";

    return (
      <div
        key={booking.id}
        className="flex gap-4 bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm"
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

        {/* Nội dung */}
        <div className="flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                {post.title || `Tin #${post.id}`}
              </h3>
            </div>

            <p className="mt-1 text-xs text-gray-500 line-clamp-1">
              {post.address ||
                [post.street, post.ward, post.district, post.province]
                  .filter(Boolean)
                  .join(", ")}
            </p>

            {tenant?.name && (
              <p className="mt-1 text-xs text-gray-500">
                Người thuê: <b>{tenant.name}</b>
                {tenant.phone ? ` • ${tenant.phone}` : ""}
              </p>
            )}
          </div>

          {/* info */}
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
                {booking.depositAmount ? formatVND(booking.depositAmount) : "—"}
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

        {/* Cột phải */}
        {!showSendDeposit ? (
          <div className="flex items-center flex-shrink-0 pl-6">
            {renderStatusBadge(booking)}
          </div>
        ) : (
          <div className="flex items-center flex-shrink-0 gap-6 pl-6">
            <div>{renderStatusBadge(booking)}</div>

            {canSendDeposit && (
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() =>
                  alert(
                    "Chức năng Gửi tiền cọc sẽ được triển khai / nối API ở bước sau."
                  )
                }
              >
                Gửi tiền cọc
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderList = (list, emptyText, options = {}) => {
    if (loading)
      return <p className="text-sm text-gray-500 py-4">Đang tải danh sách phòng đặt…</p>;
    if (err) return <p className="text-sm text-red-500 py-4">Lỗi: {err}</p>;
    if (!list.length) return <p className="text-sm text-gray-500 py-4">{emptyText}</p>;

    return <div className="space-y-3">{list.map((b) => renderBookingItem(b, options))}</div>;
  };

  return (
    <AdminPageLayout activeKey="bookings">
      <main className="max-w-[1200px] mx-auto px-0 py-2">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Quản lý phòng đặt</h1>
          <p className="text-sm text-gray-600 mt-1">
            Theo dõi các phòng đang được đặt cọc và đã xác nhận.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex gap-4 border-b px-4">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={
                  "py-3 text-sm font-semibold border-b-2 -mb-px transition px-1 " +
                  (activeTab === tab.key
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-orange-500")
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === "deposit" &&
              renderList(depositList, "Hiện chưa có phòng nào đang được đặt cọc.")}

            {activeTab === "confirmed" && (
              <>
                <div className="mb-3 flex justify-start">
                  <input
                    type="text"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="Tìm theo số điện thoại người thuê"
                    className="w-full max-w-xs rounded-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  />
                </div>

                {renderList(
                  filteredConfirmedAndPaidList,
                  searchPhone.trim()
                    ? "Không tìm thấy phòng phù hợp với số điện thoại này."
                    : "Hiện chưa có phòng nào đã được xác nhận.",
                  { showSendDeposit: true }
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </AdminPageLayout>
  );
}
