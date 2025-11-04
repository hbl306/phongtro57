import Header from "../../components/layout/Header.jsx";
import CategoryTabs from "../../components/filters/CategoryTabs.jsx";
import FilterBar from "../../components/filters/FilterBar.jsx";
import ListingGrid from "../../components/listing/ListingGrid.jsx";
import Sidebar from "../../components/sidebar/Sidebar.jsx";
import Pagination from "../../components/listing/Pagination.jsx";
import Footer from "../../components/layout/Footer.jsx";
import { cities, priceBuckets, areaBuckets, listings, newPosts } from "../../components/mockData.js";

export default function HomeShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <h1 className="text-[22px] font-bold mb-2">Kênh thông tin Phòng Trọ số 1 Việt Nam</h1>
        <CategoryTabs />
        <FilterBar cities={cities} />

        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1">
            <ListingGrid items={listings} />
            <Pagination />
          </div>
          <Sidebar priceBuckets={priceBuckets} areaBuckets={areaBuckets} newPosts={newPosts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
