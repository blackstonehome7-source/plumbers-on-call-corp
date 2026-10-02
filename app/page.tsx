const phoneDisplay = "(781) 299-5011";
const phoneHref = "tel:+17812995011";

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.1 2.9 9.4 7a1.8 1.8 0 0 1-.3 2.1L7.8 10.4a14 14 0 0 0 5.8 5.8l1.3-1.3a1.8 1.8 0 0 1 2.1-.3l4.1 2.3a1.8 1.8 0 0 1 .9 1.6v2a1.5 1.5 0 0 1-1.5 1.5C10.3 22 2 13.7 2 3.5A1.5 1.5 0 0 1 3.5 2h2a1.8 1.8 0 0 1 1.6.9Z" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="home">
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      <section className="hero" aria-labelledby="company-name">
        <div className="eyebrow" aria-label="Residential, Commercial, 24/7 Service">
          <span>Residential</span>
          <i aria-hidden="true" />
          <span>Commercial</span>
          <i aria-hidden="true" />
          <span>24/7 Service</span>
        </div>

        <h1 className="brand" id="company-name">
          <span className="brandName">
            <span>Plumbers</span>
            <em>on</em>
            <span>Call</span>
          </span>
          <span className="brandCorp">
            <i aria-hidden="true" />
            <span>Corp</span>
            <i aria-hidden="true" />
          </span>
        </h1>

        <div className="rule" aria-hidden="true">
          <span />
          <b />
          <span />
        </div>

        <p className="tagline">Reliable Plumbing. When You Need It Most.</p>
        <p className="comingSoon">Full website coming soon.</p>

        <a className="callButton" href={phoneHref} aria-label={`Call Plumbers on Call Corp at ${phoneDisplay}`}>
          <PhoneIcon />
          <span>
            <small>Call anytime</small>
            {phoneDisplay}
          </span>
        </a>
      </section>

      <footer>Serving Massachusetts</footer>
    </main>
  );
}
