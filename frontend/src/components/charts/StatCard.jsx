function StatCard({ label, value, hint, className = "" }) {
  return (
    <article className={`stat-card ${className}`}>
      <p>{label}</p>
      <h3>{value}</h3>
      <small>{hint}</small>
    </article>
  );
}

export default StatCard;
