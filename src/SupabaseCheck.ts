import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function SupabaseCheck() {
  const [status, setStatus] = useState<string>("Not tested");
  const [payload, setPayload] = useState<any>(null);

  const run = async () => {
    setStatus("Testing...");
    setPayload(null);

    const { data, error } = await supabase
      .from("healthcheck")
      .select("*")
      .limit(1);

    if (error) {
      setStatus(`Error: ${error.message}`);
      return;
    }

    setStatus("Connected ✅");
    setPayload(data);
  };

  return (
    <div style={{ padding: 16 }}>
      <button onClick={run}>Run Supabase check</button>
      <p>{status}</p>
      {payload && <pre>{JSON.stringify(payload, null, 2)}</pre>}
    </div>
  );
}
