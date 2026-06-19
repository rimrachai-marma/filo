import React from "react";

export default function BackendWaker() {
  React.use(fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`).catch(() => {}));

  return null;
}
