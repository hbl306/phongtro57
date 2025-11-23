import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import CategoryTabs from "../../components/filters/CategoryTabs";
import { AreaFilter } from "../../components/filters/AreaFilter";
import {
  PriceFilter,
  AreaPresetFilter,
} from "../../components/filters/PriceFilter";
import ListingGrid from "../../components/listing/ListingGrid";
import ListingCard from "../../components/listing/ListingCard";
import Footer from "../../components/layout/Footer";
import Pagination from "../../components/listing/Pagination";
import { listPosts } from "../../services/postService";
import { useAuth } from "./AuthContext.jsx";

const PER_PAGE = 10;

// ưu tiên label: VIP1 > VIP2 > VIP3 > không nhãn
function labelPriority(labelCode) {
  const code = (labelCode || "").toUpperCase();
  switch (code) {
    case "VIP1":
      return 4;
    case "VIP2":
      return 3;
    case "VIP3":
      return 2;
    default:
      return 0;
  }
}

export default function HomeShell() {
  const { categoryCode, provinceSlug } = useParams();
  const [sp] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Lấy filter từ URL
  const price = sp.get("price"); // "2000000-5000000"
  const area = sp.get("area"); // "20-30"
  const provinceName = sp.get("provinceName") || undefined;
  const district = sp.get("district") || undefined;
  const ward = sp.get("ward") || undefined;
  const featuresParam = sp.get("features") || "";
  const featureIds = featuresParam
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const [page, setPage] = useState(1);

  // Load list bài từ server mỗi khi filter thay đổi
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      try {
        const rows = await listPosts({
          category: categoryCode ? categoryCode.toUpperCase() : undefined,
          province: provinceName || provinceSlug || undefined,
          district,
          ward,
          price: price || undefined,
          area: area || undefined,
          features: featureIds.length ? featureIds : undefined,
        });
        if (!ignore) setPosts(rows);
      } catch (e) {
        if (!ignore) setPosts([]);
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => (ignore = true);
  }, [
    categoryCode,
    provinceSlug,
    provinceName,
    district,
    ward,
    price,
    area,
    featuresParam,
  ]);

  // Khi filter đổi -> reset về trang 1
  useEffect(() => {
    setPage(1);
  }, [
    categoryCode,
    provinceSlug,
    provinceName,
    district,
    ward,
    price,
    area,
    featuresParam,
  ]);

  const isLandlord = user?.role === 1;

  // 🔥 Chỉ lấy các bài đang hiển thị trên trang chủ:
  //    status = pending hoặc approved
  const visiblePosts = useMemo(() => {
    const active = posts.filter(
      (p) => p.status === "pending" || p.status === "approved"
    );

    // người cho thuê (role 1) chỉ thấy tin của mình
    if (!isLandlord || !user?.id) return active;
    return active.filter((p) => p.userId === user.id);
  }, [posts, isLandlord, user?.id]);

  // tách tin HOT
  const hotPosts = useMemo(
    () =>
      visiblePosts.filter(
        (p) => (p.labelCode || "").toUpperCase() === "HOT"
      ),
    [visiblePosts]
  );

  // carousel tin HOT (10s)
  const [hotIndex, setHotIndex] = useState(0);
  useEffect(() => {
    if (!hotPosts.length) return;
    setHotIndex(0);
    const timer = setInterval(() => {
      setHotIndex((prev) => (prev + 1) % hotPosts.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [hotPosts.length]);

  // sắp xếp tin còn lại: VIP1 -> VIP2 -> VIP3 -> không nhãn, trong từng nhóm: mới nhất trước
  const normalPosts = useMemo(() => {
    const nonHot = visiblePosts.filter(
      (p) => (p.labelCode || "").toUpperCase() !== "HOT"
    );
    return nonHot.slice().sort((a, b) => {
      const pa = labelPriority(a.labelCode);
      const pb = labelPriority(b.labelCode);
      if (pa !== pb) return pb - pa;

      const da = new Date(a.createdAt || a.created_at || 0).getTime();
      const db = new Date(b.createdAt || b.created_at || 0).getTime();
      return db - da;
    });
  }, [visiblePosts]);

  const pageCount = normalPosts.length
    ? Math.ceil(normalPosts.length / PER_PAGE)
    : 0;

  useEffect(() => {
    if (!pageCount) {
      setPage(1);
      return;
    }
    setPage((prev) => {
      if (prev < 1) return 1;
      if (prev > pageCount) return pageCount;
      return prev;
    });
  }, [pageCount]);

  const paginatedPosts = useMemo(() => {
    if (!normalPosts.length) return [];
    const start = (page - 1) * PER_PAGE;
    const end = start + PER_PAGE;
    return normalPosts.slice(start, end);
  }, [normalPosts, page]);

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <Header />
      <main className="max-w-[1150px] mx-auto px-3 md:px-6 py-6 grid grid-cols-12 gap-6">
        <section className="col-span-12">
          <CategoryTabs />
          <AreaFilter />
        </section>

        {/* Left: Listings */}
        <section className="col-span-12 lg:col-span-8">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Đang tải…</div>
          ) : (
            <>
              {/* Khung tin HOT nổi bật */}
              {hotPosts.length > 0 && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-red-100">
                    <h2 className="text-red-600 font-semibold text-sm md:text-base uppercase tracking-wide">
                      Tin HOT nổi bật
                    </h2>
                    <span className="text-xs text-red-500">
                      {hotIndex + 1}/{hotPosts.length}
                    </span>
                  </div>
                  <div className="p-3 md:p-4">
                    <ListingCard post={hotPosts[hotIndex]} variant="hot" />
                  </div>
                </div>
              )}

              {/* Danh sách còn lại đã ưu tiên VIP1 -> VIP2 -> VIP3 -> không nhãn + phân trang */}
              {normalPosts.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  Không có bài đăng nào phù hợp.
                </div>
              ) : (
                <>
                  <ListingGrid posts={paginatedPosts} layout="row" />
                  <Pagination
                    page={page}
                    pageCount={pageCount}
                    onPageChange={setPage}
                  />
                </>
              )}
            </>
          )}
        </section>

        {/* Right: Filters */}
        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold mb-3">Xem theo khoảng giá</h3>
            <PriceFilter />
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-semibold mb-3">Xem theo diện tích</h3>
            <AreaPresetFilter />
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
