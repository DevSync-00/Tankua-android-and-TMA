/** Matches marketing homepage hero atmosphere (brand-dark + gold radial wash). */
export function AuthHeroBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0" aria-hidden>
      <div
        className="absolute inset-0 bg-brand-dark"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 85% 55% at 80% 15%, rgba(245,168,0,0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 10% 90%, rgba(245,168,0,0.06) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23F5A800' fill-opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
