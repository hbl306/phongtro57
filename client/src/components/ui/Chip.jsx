export default function Chip({ label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition
      ${active ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-800"}
      hover:border-orange-300`}
    >
      {label}
    </button>
  );
}
