export default function RiskMeter({ risk }) {
    const getColor = () => {
      if (risk > 60) return "red";
      if (risk > 30) return "orange";
      return "green";
    };
  
    return (
      <div>
        <h4>Risk Score</h4>
        <div style={{
          width: "200px",
          height: "20px",
          background: "#ddd",
          borderRadius: "10px"
        }}>
          <div style={{
            width: `${risk}%`,
            height: "100%",
            background: getColor(),
            borderRadius: "10px"
          }}></div>
        </div>
        <p>{risk}</p>
      </div>
    );
  }