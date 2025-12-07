// client/src/components/transaction/TransactionTabs.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const TABS = [
  { key: "recharge", label: "Nạp tiền vào tài khoản", path: "/quan-ly/nap-tien" },
  { key: "rechargeHistory", label: "Lịch sử nạp tiền", path: "/quan-ly/lich-su-nap" },
  { key: "paymentHistory", label: "Lịch sử thanh toán", path: "/quan-ly/lich-su-thanh-toan" },
];

export default function TransactionTabs({ active }) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-8 text-sm mt-2">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => navigate(tab.path)}
            className={
              "pb-1 border-b-2 transition-all " +
              (isActive
                ? "border-orange-500 text-orange-500 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-900")
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
