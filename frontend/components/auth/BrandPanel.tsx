const ICON_LOGO = "/logo.png";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={compact ? "login-logo-lockup login-logo-lockup--compact" : "login-logo-lockup"}
      aria-label="DialyCore"
    >
      <img src={ICON_LOGO} alt="" className="login-logo-mark" />
      <span className="login-logo-name">DialyCore</span>
    </div>
  );
}

export function BrandPanel() {
  return (
    <aside className="login-brand-panel" aria-labelledby="brand-heading">
      <div className="login-brand-content">
        <BrandLogo />

        <section className="login-brand-intro">
          <h1 id="brand-heading" className="login-brand-heading">
            Hemodialysis care,
            <br />
            <span>organized.</span>
          </h1>
          <p className="login-brand-description">
            Open-source hemodialysis unit records
            <br />
            and workflow management.
          </p>
        </section>

        <div className="login-brand-statement">
          <span className="login-brand-rule" aria-hidden="true" />
          <p>
            Built with domain experts,
            <br />
            <strong>for dialysis professionals.</strong>
          </p>
          <small>A more organized tomorrow in dialysis care.</small>
        </div>
      </div>
    </aside>
  );
}
