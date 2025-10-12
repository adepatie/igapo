import type { PropsWithChildren, ReactNode } from "react";

type LayoutProps = PropsWithChildren<{
  sidebar?: ReactNode;
  footer?: ReactNode;
  pocketwatch?: ReactNode;
  supplyDisplay?: ReactNode;
  survivalStatus?: ReactNode;
  weatherIndicator?: ReactNode;
  partyPanel?: ReactNode;
  minimap?: ReactNode;
}>;

export function Layout({
  children,
  sidebar,
  footer,
  pocketwatch,
  supplyDisplay,
  survivalStatus,
  weatherIndicator,
  partyPanel,
  minimap,
}: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1 className="app-shell__brand">Igapó Expedition</h1>
        <div className="app-shell__hud">
          {pocketwatch && (
            <div className="app-shell__pocketwatch">{pocketwatch}</div>
          )}
          {weatherIndicator && (
            <div className="app-shell__weather">{weatherIndicator}</div>
          )}
          {supplyDisplay && (
            <div className="app-shell__supplies">{supplyDisplay}</div>
          )}
          {survivalStatus && (
            <div className="app-shell__survival">{survivalStatus}</div>
          )}
        </div>
      </header>

      <main className="app-shell__main">
        <section className="app-shell__content">{children}</section>
        {sidebar && <aside className="app-shell__sidebar">{sidebar}</aside>}
      </main>

      {(partyPanel || minimap) && (
        <div className="app-shell__panels">
          {partyPanel && <div className="app-shell__party">{partyPanel}</div>}
          {minimap && <div className="app-shell__minimap">{minimap}</div>}
        </div>
      )}

      {footer && <footer className="app-shell__footer">{footer}</footer>}
    </div>
  );
}

export default Layout;
