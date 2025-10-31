// src/components/EmbeddedSuperset.jsx
import { useEffect, useRef, useState } from "react";
import { embedDashboard } from "@superset-ui/embedded-sdk";

export default function EmbeddedSuperset({ dashboardId, height = 820 }) {
  const mountRef = useRef(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let stop = false;

    async function run() {
      setErr("");
      if (!mountRef.current || !dashboardId) return;
      mountRef.current.innerHTML = "";

      try {
        await embedDashboard({
          id: dashboardId,                          // UUID dashboard
          supersetDomain: "http://localhost:8088",  // domain Superset
          mountPoint: mountRef.current,
          // BE của bạn sẽ cấp guest token:
          fetchGuestToken: () =>
            fetch("/api/superset/token", { method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dashboardId })
            })
            .then(r => {
              if (!r.ok) throw new Error(`token ${r.status}`);
              return r.json();
            })
            .then(j => j.token),
          dashboardUiConfig: { hideTitle: true, filters: { expanded: false } },
        });
      } catch (e) {
        console.error(e);
        if (!stop) setErr(e.message || "Không thể nhúng Superset");
      }
    }

    run();
    return () => { stop = true; if (mountRef.current) mountRef.current.innerHTML = ""; };
  }, [dashboardId]);

  return (
    <div style={{ width: "100%", height, border:"1px solid #eee", borderRadius:8, overflow:"hidden", background:"#fff" }}>
      <div ref={mountRef} style={{ width:"100%", height:"100%" }} />
      {err && <div style={{ padding: 12, color:"#a61d24" }}>Lỗi: {String(err)}</div>}
    </div>
  );
}
