// src/components/layout/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-10">
      {/* phần trên */}
      <div className="max-w-[1200px] mx-auto px-4 pt-8 pb-6">
        {/* Logo + tagline */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-[#ff5e2e]">
              PHONGTRO57.COM
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#fff3ec] text-[#ff5e2e] font-medium">
              Kênh thông tin phòng trọ số 1 Việt Nam
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2 max-w-2xl">
            Nền tảng đăng tin cho thuê phòng trọ, nhà nguyên căn, căn hộ dịch vụ,
            ở ghép… giúp kết nối nhanh chóng giữa người thuê và chủ nhà một cách
            an toàn, minh bạch.
          </p>
        </div>

        {/* các cột link */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          {/* Cột 1 */}
          <div>
            <h4 className="text-[13px] font-semibold text-gray-800 mb-3 uppercase">
              Về PHONGTRO57.COM
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li><Link to="#" className="hover:text-[#ff5e2e]">Giới thiệu</Link></li>
              <li><Link to="#" className="hover:text-[#ff5e2e]">Quy chế hoạt động</Link></li>
              <li><Link to="#" className="hover:text-[#ff5e2e]">Quy định sử dụng</Link></li>
              <li><Link to="#" className="hover:text-[#ff5e2e]">Chính sách bảo mật</Link></li>
              <li><Link to="#" className="hover:text-[#ff5e2e]">Liên hệ hỗ trợ</Link></li>
            </ul>
          </div>

          {/* Cột 2 */}
          <div>
            <h4 className="text-[13px] font-semibold text-gray-800 mb-3 uppercase">
              Dành cho khách hàng
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li><Link to="#" className="hover:text-[#ff5e2e]">Câu hỏi thường gặp</Link></li>
              <li><Link to="#" className="hover:text-[#ff5e2e]">Hướng dẫn đăng tin</Link></li>
              <li><Link to="#" className="hover:text-[#ff5e2e]">Bảng giá dịch vụ</Link></li>
              <li><Link to="#" className="hover:text-[#ff5e2e]">Quy định đăng tin</Link></li>
              <li><Link to="#" className="hover:text-[#ff5e2e]">Giải quyết khiếu nại</Link></li>
            </ul>
          </div>

          {/* Cột 3: thanh toán */}
          <div>
            <h4 className="text-[13px] font-semibold text-gray-800 mb-3 uppercase">
              Phương thức thanh toán
            </h4>
            <div className="flex flex-wrap gap-2">
              {["VISA", "Mastercard", "ATM", "Momo", "ZaloPay", "VNPay"].map(
                (item) => (
                  <div
                    key={item}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-700 bg-gray-50"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Thanh toán online hoặc chuyển khoản ngân hàng linh hoạt.
            </p>
          </div>

          {/* Cột 4: social + công ty */}
          <div>
            <h4 className="text-[13px] font-semibold text-gray-800 mb-3 uppercase">
              Theo dõi PHONGTRO57
            </h4>
            <div className="flex items-center gap-2 mb-3">
              {/* icon đơn giản, có thể thay bằng icon lib nếu bạn dùng */}
             {/* <a
                href="#"
                className="w-8 h-8 rounded-full bg-[#1877f2]/10 flex items-center justify-center text-[#1877f2] text-lg"
              >
                f
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-[#ff0000]/10 flex items-center justify-center text-[#ff0000] text-lg"
              >
                ▶
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-[#0f9af0]/10 flex items-center justify-center text-[#0f9af0] text-xs font-bold"
              >
                Zalo
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm"
              >
                ♫
              </a>*/}
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Công ty TNHH PHONGTRO57<br />
              Địa chỉ: 141 Chiến Thắng, Thanh Trì, Hà Nội<br />
              <br />
              Hotline: <span className="font-semibold text-[#ff5e2e]">0328925990</span>
            </p>
          </div>
        </div>
      </div>

      {/* đường kẻ mỏng + dòng bản quyền */}
      <div className="border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-gray-500">
            © {new Date().getFullYear()} <span className="font-semibold">phongtro57</span> — Người thuê là người khôn.
          </p>
          <p className="text-[11px] text-gray-400">
            Made by Team Tồ Tề hẹ hẹ hẹ...
          </p>
        </div>
      </div>
    </footer>
  );
}
