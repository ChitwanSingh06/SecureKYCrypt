import { useLocation } from "react-router-dom";

export default function Dashboard() {
  const { state } = useLocation();

  return (
    <div>
      <h2>Verification Result</h2>
      <p>Telecom Owner: {state.telecom_owner}</p>
      <p>Ownership Score: {state.ownership_score}</p>
      <p>Risk Score: {state.risk_score}</p>
      <h3 style={{color:"green"}}>SAFE USER</h3>
    </div>
  );
}