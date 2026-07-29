import '../masterAdminGlobal.css';
import '@/styles/master-admin/masterAdmin.css';

export default function MasterAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ma-scope master-admin-page-shell">
      {children}
    </div>
  );
}