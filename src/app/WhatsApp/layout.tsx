import '../masterAdminGlobal.css';
import '@/styles/master-admin/masterAdmin.runtime.css';
export default function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ma-scope master-admin-page-shell item-master-layout whatsapp-layout">
      {children}
    </div>
  );
}