import { MasterSidebar } from "@/components/layout/master-sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-context";

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <MasterSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
