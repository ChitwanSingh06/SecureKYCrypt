import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getDeviceInfo } from "../utils/deviceFingerprint";
import { getBehaviorInfo } from "../utils/behaviorTracker";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const navigate = useNavigate();

  const handleVerify = async () => {
    const res = await axios.post("http://localhost:5000/verify", {
      name,
      mobile,
      deviceInfo: getDeviceInfo(),
      behaviorInfo: getBehaviorInfo()
    });

    if (res.data.status === "fraud") {
      navigate("/honeypot");
    } else {
      navigate("/dashboard", { state: res.data });
    }
  };

  return (
    <div>
      <h2>Mobile Ownership Verification</h2>
      <input placeholder="Name" onChange={e=>setName(e.target.value)} />
      <input placeholder="Mobile" onChange={e=>setMobile(e.target.value)} />
      <button onClick={handleVerify}>Verify</button>
    </div>
  );
}