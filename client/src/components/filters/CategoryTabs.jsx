import { NavLink, useParams } from "react-router-dom";


const CATEGORIES = [
{ code: "PT", label: "Phòng trọ" },
{ code: "NNC", label: "Nhà nguyên căn" },
{ code: "CH", label: "Căn hộ/chung cư mini" },
{ code: "OG", label: "Ở ghép" },
{ code: "MB", label: "Mặt bằng" },
];


export default function CategoryTabs() {
const { categoryCode } = useParams();
return (
<div className="flex flex-wrap gap-3 border-b pb-3">
{CATEGORIES.map((c) => (
<NavLink
key={c.code}
to={`/c/${c.code.toLowerCase()}`}
className={({ isActive }) =>
[
"px-4 py-2 rounded-full text-sm transition-all",
isActive || categoryCode?.toUpperCase() === c.code
? "bg-[#ffece2] text-[#e65100] border border-[#ffbb97] shadow-sm"
: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200",
].join(" ")
}
>
{c.label}
</NavLink>
))}
</div>
);
}