// src/hooks/usePosts.js
import { useEffect, useRef, useState } from "react";
import { listPosts } from "../services/postService";

export default function usePosts(initialParams = {}) {
  const [params, setParams] = useState({ page: 1, limit: 10, ...initialParams });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef();

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError("");
    listPosts(params)
      .then((res) => {
        const it = res?.items || res?.data || res; // linh hoạt theo backend
        setItems(Array.isArray(it) ? it : []);
        setTotal(res?.total ?? Array.isArray(it) ? it.length : 0);
      })
      .catch((e) => setError(e.message || "Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [JSON.stringify(params)]);

  return { items, total, params, setParams, loading, error };
}
