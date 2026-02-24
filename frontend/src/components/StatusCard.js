export default function StatusCard({ status }) {
    const color = status === "safe" ? "green" : "red";
  
    return (
      <div style={{
        padding: "10px",
        marginTop: "20px",
        border: `2px solid ${color}`,
        borderRadius: "8px"
      }}>
        <h3 style={{ color }}>
          {status === "safe" ? "Verified User" : "Fraud Detected"}
        </h3>
      </div>
    );
  }