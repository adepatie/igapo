import type { PropsWithChildren, ReactNode } from "react";

type LayoutProps = PropsWithChildren<{
  sidebar?: ReactNode;
  footer?: ReactNode;
}>;

export function Layout({ children, sidebar, footer }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1 className="app-shell__brand">Igapó Expedition</h1>
      </header>

      <main className="app-shell__main">
        <section className="app-shell__content">{children}</section>
        {sidebar && <aside className="app-shell__sidebar">{sidebar}</aside>}
      </main>

      {footer && <footer className="app-shell__footer">{footer}</footer>}
    </div>
  );
}

export default Layout;
