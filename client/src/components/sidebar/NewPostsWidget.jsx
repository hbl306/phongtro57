// src/components/NewPostsWidget.jsx
export default function NewPostsWidget({ items = [] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mt-3">
      <div className="font-bold text-sm mb-3">Tin mới đăng</div>
      <div className="grid gap-3">
        {items.map((it) => (
          <a key={it.id} href="#" className="no-underline">
            <div className="flex gap-3">
              <div className="w-16 h-12 rounded-lg bg-gray-100 grid place-items-center text-xs text-gray-400">
                IMG
              </div>
              <div>
                <div className="text-[15px] leading-snug text-gray-900 line-clamp-2">{it.title}</div>
                <div className="text-green-600 text-sm mt-0.5">{it.price}</div>
                <div className="text-gray-400 text-xs">{it.postedAgo}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
