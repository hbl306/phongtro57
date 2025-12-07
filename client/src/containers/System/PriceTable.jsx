// src/containers/System/PriceTable.jsx
import React from "react";
import hotImg from "../../assets/HOT.png";
import vip1Img from "../../assets/VIP1.png";
import vip2Img from "../../assets/VIP2.png";
import vip3Img from "../../assets/VIP3.png";

const LABELS = [
  {
    code: "HOT",
    name: "HOT",
    img: hotImg,
    price: 50000,
    titleColor: "Màu đỏ",
  },
  {
    code: "VIP1",
    name: "VIP1",
    img: vip1Img,
    price: 30000,
    titleColor: "Màu hồng",
  },
  {
    code: "VIP2",
    name: "VIP2",
    img: vip2Img,
    price: 20000,
    titleColor: "Màu vàng",
  },
  {
    code: "VIP3",
    name: "VIP3",
    img: vip3Img,
    price: 10000,
    titleColor: "Màu xanh dương",
  },
  {
    code: "NONE",
    name: "none",
    img: null,
    price: 0,
    titleColor: "Màu nâu",
  },
];

const EXTEND_PLANS = [
  { days: 3, price: 15000 },
  { days: 7, price: 30000 },
  { days: 30, price: 135000 },
];

const formatVND = (n = 0) =>
  (Number(n) || 0).toLocaleString("vi-VN") + "đ";

function CheckIcon() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold shadow-sm">
      ✓
    </span>
  );
}

export default function ServicePricing() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white">
        <h1 className="text-lg font-semibold text-gray-900">
          Bảng giá dịch vụ
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tham khảo chi tiết giá các loại nhãn tin và phí gia hạn hiển thị.
        </p>
      </div>

      {/* Content */}
      <div className="px-6 py-6 flex-1 overflow-auto bg-[#f5f5f7]">
        {/* Dùng flex để bảng nhãn rất to, bảng gia hạn nhỏ bên phải */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* BẢNG GIÁ NHÃN – to, chiếm gần hết chiều ngang */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full lg:flex-[3]">
            <h2 className="text-xl md:text-2xl font-semibold text-center tracking-wide text-gray-900">
              BẢNG GIÁ NHÃN
            </h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm md:text-base">
                <tbody className="align-middle">
                  {/* Loại nhãn */}
                  <tr className="border-b border-dashed border-gray-200">
                    <th className="pr-6 py-3 text-left align-middle text-gray-800 whitespace-nowrap">
                      Loại nhãn
                    </th>
                    {LABELS.map((lb) => (
                      <td
                        key={lb.code}
                        className="py-3 px-3 text-center min-w-[90px]"
                      >
                        <div className="inline-flex flex-col items-center gap-1">
                          {lb.img ? (
                            <img
                              src={lb.img}
                              alt={lb.name}
                              className="h-12 md:h-14 object-contain drop-shadow-sm"
                            />
                          ) : (
                            <div className="h-12 px-5 flex items-center justify-center rounded-md bg-gray-100 text-xs text-gray-500 border border-gray-200">
                              none
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Giá nhãn */}
                  <tr className="border-b border-dashed border-gray-200">
                    <th className="pr-6 py-3 text-left align-middle text-gray-800 whitespace-nowrap">
                      Giá nhãn
                    </th>
                    {LABELS.map((lb) => (
                      <td
                        key={lb.code + "-price"}
                        className="py-3 px-3 text-center font-semibold text-gray-900"
                      >
                        {lb.price ? formatVND(lb.price) : "0đ"}
                      </td>
                    ))}
                  </tr>

                  {/* Tiêu đề */}
                  <tr className="border-b border-dashed border-gray-200">
                    <th className="pr-6 py-3 text-left align-middle text-gray-800 whitespace-nowrap">
                      Tiêu đề
                    </th>
                    {LABELS.map((lb) => (
                      <td
                        key={lb.code + "-title"}
                        className="py-3 px-3 text-center font-semibold"
                      >
                        <span
                          className={
                            lb.code === "HOT"
                              ? "text-red-500"
                              : lb.code === "VIP1"
                              ? "text-pink-500"
                              : lb.code === "VIP2"
                              ? "text-yellow-500"
                              : lb.code === "VIP3"
                              ? "text-sky-500"
                              : "text-amber-700"
                          }
                        >
                          {lb.titleColor}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Tự động duyệt */}
                  <tr>
                    <th className="pr-6 py-3 text-left align-middle text-gray-800 whitespace-nowrap">
                      Tự động duyệt
                    </th>
                    {LABELS.map((lb) => (
                      <td
                        key={lb.code + "-auto"}
                        className="py-3 px-3 text-center"
                      >
                        {/* NONE thì không hiển thị tích xanh */}
                        {lb.code === "NONE" ? null : <CheckIcon />}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              *Giá trên áp dụng cho mỗi tin đăng. 
            </p>
          </div>

          {/* BẢNG GIÁ GIA HẠN – nhỏ, như 1 góc của bảng nhãn */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full lg:flex-[1] lg:max-w-md self-stretch">
            <h2 className="text-base md:text-lg font-semibold text-center tracking-wide text-gray-900">
              BẢNG GIÁ GIA HẠN
            </h2>

            <div className="mt-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left pb-2">Thời gian</th>
                    <th className="text-right pb-2">Giá gia hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {EXTEND_PLANS.map((p) => (
                    <tr
                      key={p.days}
                      className="border-b last:border-0 border-dashed border-gray-200"
                    >
                      <td className="py-3 pr-4 text-gray-800">
                        <span className="font-medium">{p.days} ngày</span>
                      </td>
                      <td className="py-3 text-right font-semibold text-gray-900">
                        {formatVND(p.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              *Phí gia hạn giúp tin của bạn tiếp tục được hiển thị theo đúng
              nhãn và vị trí ưu tiên trên hệ thống.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
