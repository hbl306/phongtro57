import PriceFilter from "../filters/PriceFilter.jsx";
import AreaFilter from "../filters/AreaFilter.jsx";      // <-- default import
import NewPostsWidget from "./NewPostsWidget.jsx";

export default function Sidebar({ priceBuckets = [], areaBuckets = [], newPosts = [] }) {
  return (
    <aside className="w-full lg:w-[300px] shrink-0">
      <PriceFilter items={priceBuckets} />
      <AreaFilter items={areaBuckets} />
      <NewPostsWidget items={newPosts} />
    </aside>
  );
}
