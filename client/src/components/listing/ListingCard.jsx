// src/components/ListingCard.jsx
export default function ListingCard({ item }) {
  const img = item?.images?.[0];

  return (
    <article className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Hình ảnh */}
      <div className="relative">
        <img
          src={img}
          alt={item?.title || "listing image"}
          className="w-full h-56 object-cover"
        />

        {/* Badge ví dụ: "CHO THUÊ NHANH" */}
        {item?.badges?.map((b) => (
          <span
            key={b}
            className="absolute left-2 top-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-md"
          >
            {b}
          </span>
        ))}

        {/* Icon video nếu có */}
        {item?.hasVideo && (
          <span className="absolute right-2 bottom-2 bg-gray-900 text-white w-9 h-9 grid place-items-center rounded-full text-xs">
            ▶
          </span>
        )}
      </div>

      {/* Thông tin */}
      <div className="p-3.5">
        <a href="#" className="no-underline text-gray-900">
          <h3 className="m-0 text-base leading-5 line-clamp-2">
            {item?.title}
          </h3>
        </a>

        <div className="flex flex-wrap gap-3 mt-2 text-sm">
          <span className="text-green-600 font-bold">{item?.price}</span>
          <span className="text-gray-700">{item?.area}</span>
        </div>

        <div className="text-gray-500 text-sm mt-1">{item?.location}</div>

        <div className="text-gray-400 text-xs mt-1.5">
          {item?.postedAgo}
        </div>
      </div>
    </article>
  );
}
