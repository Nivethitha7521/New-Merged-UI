import "../masterAdminGlobal.css";
import "@/styles/master-admin/masterAdmin.css";
import "./recipeBehavior.css";
import "./recipeEditor.css";
export default function YenRecipeLayout({
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