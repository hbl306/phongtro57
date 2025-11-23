// src/components/media/MediaGallery.jsx
import { useMemo, useState } from "react";
import fallbackImg from "../../assets/logopost.jpg";

function Arrow({ onClick, dir = "left" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 ${
        dir === "left" ? "left-2" : "right-2"
      } w-9 h-9 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center`}
      aria-label={dir === "left" ? "Prev" : "Next"}
    >
      {dir === "left" ? "‹" : "›"}
    </button>
  );
}

export default function MediaGallery({ images = [], videos = [] }) {
  const items = useMemo(() => {
    const v = (videos || []).map((vi) => ({ kind: "video", ...vi }));
    const i = (images || []).map((src) => ({ kind: "image", src }));
    return [...v, ...i]; // ưu tiên video trước
  }, [images, videos]);

  const [idx, setIdx] = useState(0);
  if (!items.length) {
    items.push({ kind: "image", src: fallbackImg });
  }
  const cur = items[idx];

  const next = () => setIdx((p) => (p + 1) % items.length);
  const prev = () => setIdx((p) => (p - 1 + items.length) % items.length);

  return (
    <div className="w-full">
      <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-black/5">
        {/* Main viewer */}
        {cur.kind === "image" ? (
          <img
            src={cur.src}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = fallbackImg)}
          />
        ) : cur.type === "file" ? (
          <video src={cur.src} className="w-full h-full object-contain bg-black" controls />
        ) : cur.type === "youtube" || cur.type === "tiktok" ? (
          <iframe
            src={cur.src}
            title="video"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <iframe src={cur.src} title="video" className="w-full h-full border-0" />
        )}

        {/* Arrows */}
        {items.length > 1 && (
          <>
            <Arrow onClick={prev} dir="left" />
            <Arrow onClick={next} dir="right" />
          </>
        )}
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`shrink-0 w-24 h-16 rounded-lg overflow-hidden border ${
                i === idx ? "border-emerald-500" : "border-gray-200"
              }`}
            >
              {it.kind === "image" ? (
                <img src={it.src} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black text-white grid place-items-center text-xs">
                  {it.type === "youtube" ? "YouTube" : it.type === "tiktok" ? "TikTok" : "Video"}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
