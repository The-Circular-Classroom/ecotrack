export function SectionCard({ title, eyebrow, children, footer }) {
  return (
    <section className="section-card">
      {eyebrow ? <p className="section-card__eyebrow">{eyebrow}</p> : null}
      <div className="section-card__header">
        <h2>{title}</h2>
      </div>
      <div className="section-card__body">{children}</div>
      {footer ? <div className="section-card__footer">{footer}</div> : null}
    </section>
  );
}
