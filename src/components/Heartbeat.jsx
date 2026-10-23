import { useEffect } from "react";
import API from "../services/api";

function Heartbeat() {
  useEffect(() => {
    const sendHeartbeat = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        return;
      }

      try {
        await API.post("/auth/heartbeat/");

        console.log("CineHub heartbeat sent");
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    };

    // Send immediately
    sendHeartbeat();

    // Every 60 seconds
    const interval = setInterval(sendHeartbeat, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return null;
}

export default Heartbeat;

