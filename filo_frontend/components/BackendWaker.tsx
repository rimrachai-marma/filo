"use client";

import React from "react";

export default function BackendWaker() {
  React.useEffect(() => {
    async function wakeBackend() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);

        const data = await response.json();

        console.log("Backend response:", data);
      } catch (error) {
        console.error("Backend wake failed:", error);
      }
    }

    wakeBackend();
  }, []);

  return null;
}
