"use client";

import dynamic from "next/dynamic";

const GoongMapCore = dynamic(() => import("./goong-map-core"), {
  ssr: false,
  loading: () => <div>Đang tải bản đồ...</div>,
});

export default GoongMapCore;
