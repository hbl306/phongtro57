// src/components/ListingGrid.jsx
import ListingCard from "./ListingCard.jsx";

export default function ListingGrid({ items = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => (
        <ListingCard key={it.id} item={it} />
      ))}
    </div>
  );
}
