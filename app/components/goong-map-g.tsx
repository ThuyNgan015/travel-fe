"use client";

import dynamic from "next/dynamic";

const GoongMapG = dynamic(() => import("./gg-map"), {
  ssr: false,
  loading: () => <div>Đang tải bản đồ...</div>,
});

export default GoongMapG;
