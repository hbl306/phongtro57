// src/containers/System/PostList.jsx
export default function PostList() {
  // tạm thời làm cái khung giống ảnh bạn gửi
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Danh sách tin đăng</h1>

      {/* thanh tab nhỏ */}
      <div className="flex gap-4 border-b mb-6 text-sm">
        <button className="pb-2 border-b-2 border-orange-500 text-orange-500">
          Tất cả (0)
        </button>
        <button className="pb-2 text-gray-500">Đang hiển thị (0)</button>
        <button className="pb-2 text-gray-500">Hết hạn (0)</button>
        <button className="pb-2 text-gray-500">Tin ẩn (0)</button>
      </div>

      {/* vùng rỗng */}
      <div className="bg-white rounded-lg border border-dashed border-gray-200 py-16 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-2">Tìm thấy 0 tin đăng</p>
        <p className="text-gray-500">
          Bấm <span className="text-blue-500 cursor-pointer">vào đây</span> để bắt đầu đăng tin
        </p>
      </div>
    </div>
  );
}
