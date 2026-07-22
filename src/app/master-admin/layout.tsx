import '../masterAdminGlobal.css';

export default function MasterAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="ma-scope">{children}</div>;
}