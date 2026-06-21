"use client";

import React from "react";

export default function BackendWaker() {
  React.useEffect(() => {
    (async () => {
      console.log("Pinging backend...");

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);

        const data = await response.json();

        console.log("Backend response:", data);
      } catch (error) {
        console.error("Backend ping failed:", error);
      }
    })();
  }, []);

  return null;
}
