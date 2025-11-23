// src/containers/Public/PostFeed.jsx
import React from "react";
import usePosts from "../../utils/usePosts";
import ListingGrid from "../../components/listing/ListingGrid";

export default function PostFeed({ initial = {} }) {
  const { items, loading } = usePosts(initial); // {categoryCode, province, page, limit, ...}
  return <ListingGrid items={items} loading={loading} />;
}
