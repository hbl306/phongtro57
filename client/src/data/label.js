// Map giá nhãn (đ) theo code trong DB
export const LABEL_COST = {
  HOT: 50000,
  VIP1: 30000,
  VIP2: 20000,
  VIP3: 10000,
};

export function formatVND(n = 0) {
  try {
    return n.toLocaleString("vi-VN") + "đ";
  } catch {
    return `${n}đ`;
  }
}
