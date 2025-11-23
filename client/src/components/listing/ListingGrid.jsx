// src/components/listing/ListingGrid.jsx
import ListingCard from "./ListingCard";

export default function ListingGrid({ posts }) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return <div className="py-10 text-center text-gray-500">Chưa có bài đăng</div>;
  }
  return (
    <div className="space-y-5">
      {posts.map((p) => (
        <ListingCard key={p.id} post={p} />
      ))}
    </div>
  );
}
