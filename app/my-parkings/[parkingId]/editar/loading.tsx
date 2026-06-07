export default function Loading() {
  return (
    <main style={{ padding: "2rem 1rem" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: "1rem",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
          margin: "0 auto",
          maxWidth: "1120px",
          minHeight: "65vh",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #eef4ff 25%, #dfeaff 50%, #eef4ff 75%)",
            borderRadius: "0.9rem",
            height: "2.1rem",
            marginBottom: "1rem",
            width: "40%",
          }}
        />
        <div
          style={{
            background: "linear-gradient(90deg, #f4f6f8 25%, #e7ebf0 50%, #f4f6f8 75%)",
            borderRadius: "1rem",
            height: "11rem",
            marginBottom: "1rem",
          }}
        />
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              style={{
                background: "linear-gradient(90deg, #f4f6f8 25%, #e7ebf0 50%, #f4f6f8 75%)",
                borderRadius: "1rem",
                height: "5.5rem",
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
