export default function PriceFilter({ items = [], onPick }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="font-bold text-sm mb-2">Xem theo khoảng giá</div>
      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x}>
            <button onClick={() => onPick?.(x)} className="text-blue-600 hover:underline text-[15px]">
              {x}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
