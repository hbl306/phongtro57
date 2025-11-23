import { NavLink, useParams } from "react-router-dom";


const CITIES = [
{ slug: "ho-chi-minh", label: "Phòng trọ Hồ Chí Minh" },
{ slug: "ha-noi", label: "Phòng trọ Hà Nội" },
{ slug: "da-nang", label: "Phòng trọ Đà Nẵng" },
{ slug: "binh-duong", label: "Phòng trọ Bình Dương" },
];


export function AreaFilter({ compact = false }) {
const { provinceSlug } = useParams();
return (
<div className={compact ? "flex gap-2 flex-wrap" : "flex gap-3 flex-wrap mt-4"}>
{CITIES.map((c) => (
<NavLink
key={c.slug}
to={`/p/${c.slug}`}
className={({ isActive }) =>
[
"px-3 py-1.5 rounded-full text-sm",
isActive || provinceSlug === c.slug
? "bg-[#e8f1ff] text-[#003773] border border-[#b8d2ff]"
: "bg-white text-[#1e40af] border border-[#cfe3ff] hover:bg-[#f5f9ff]",
].join(" ")
}
title={c.label}
>
{c.label.replace("Phòng trọ ", "")}
</NavLink>
))}
<NavLink
to="/"
className={({ isActive }) =>
[
"px-3 py-1.5 rounded-full text-sm",
isActive ? "bg-gray-100" : "bg-white hover:bg-gray-50 border border-gray-200",
].join(" ")
}
>
Tất cả
</NavLink>
</div>
);
}