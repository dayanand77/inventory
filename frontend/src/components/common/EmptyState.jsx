function EmptyState({ title, subtitle }) {
  return (
    <div className="empty-state">
      <h4>{title}</h4>
      <p>{subtitle}</p>
    </div>
  );
}

export default EmptyState;
