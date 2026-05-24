import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LogOut, PanelLeft, FolderOpen, BookOpen, Newspaper, Flame } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  {
    icon: BookOpen,
    label: "훈련 콘솔",
    labelSub: "训练控制台",
    path: "/",
    badge: null,
  },
  {
    icon: Newspaper,
    label: "매일 콘텐츠",
    labelSub: "每日内容",
    path: "/daily",
    badge: "NEW",
  },
  {
    icon: FolderOpen,
    label: "자료실",
    labelSub: "学习资料",
    path: "/files",
    badge: null,
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E8432D] to-[#C9A84C] flex items-center justify-center">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <div className="text-white font-black text-xl tracking-tight" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                3개월 한국인화
              </div>
              <div className="text-white/40 text-xs mt-1">지옥 훈련소 · Native Mode</div>
            </div>
          </div>
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <h1 className="text-white font-bold text-lg text-center">
              로그인이 필요합니다
            </h1>
            <p className="text-white/50 text-sm text-center leading-relaxed">
              이 페이지에 접근하려면 로그인이 필요합니다.<br />
              <span className="text-white/30 text-xs">此页面需要登录才能访问。</span>
            </p>
            <Button
              onClick={() => { window.location.href = getLoginUrl(); }}
              size="lg"
              className="w-full bg-[#E8432D] hover:bg-[#D03020] text-white font-bold border-0 rounded-xl"
            >
              로그인 · 登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0 bg-[#0F0F0F]" disableTransition={isResizing}>
          {/* Sidebar Header */}
          <SidebarHeader className="h-16 justify-center border-b border-white/8">
            <div className="flex items-center gap-3 px-3 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-white/50" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="text-white font-black text-sm tracking-tight truncate"
                    style={{ fontFamily: "'Noto Serif KR', serif" }}
                  >
                    한국인화 훈련소
                  </div>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Sidebar Content */}
          <SidebarContent className="gap-0 pt-3">
            {/* Korean decorative text */}
            {!isCollapsed && (
              <div className="px-4 mb-4">
                <div className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
                  메뉴 · MENU
                </div>
              </div>
            )}
            <SidebarMenu className="px-2 gap-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={`${item.label} · ${item.labelSub}`}
                      className={`h-11 rounded-xl transition-all font-medium group relative ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-[#E8432D]" : ""}`}
                      />
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate">{item.label}</div>
                          {!isCollapsed && (
                            <div className="text-[10px] text-white/30 truncate">{item.labelSub}</div>
                          )}
                        </div>
                        {item.badge && !isCollapsed && (
                          <span className="text-[9px] font-black bg-[#E8432D] text-white px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#E8432D] rounded-r-full" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {/* Divider with Korean text */}
            {!isCollapsed && (
              <div className="px-4 mt-6 mb-4">
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  오늘의 목표 · TODAY
                </div>
                <div className="mt-2 bg-white/5 rounded-xl p-3 border border-white/8">
                  <div className="text-xs text-white/60 font-medium leading-relaxed">
                    매일 조금씩 성장하기
                  </div>
                  <div className="text-[10px] text-white/25 mt-0.5">每天进步一点点</div>
                </div>
              </div>
            )}
          </SidebarContent>

          {/* Sidebar Footer */}
          <SidebarFooter className="p-3 border-t border-white/8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors w-full text-left focus:outline-none group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-8 w-8 border border-white/20 shrink-0 bg-gradient-to-br from-[#E8432D] to-[#C9A84C]">
                    <AvatarFallback className="text-xs font-bold text-white bg-transparent">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-bold text-white/80 truncate leading-none">
                      {user?.name || "훈련생"}
                    </p>
                    <p className="text-[10px] text-white/30 truncate mt-1">
                      {user?.email || ""}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#1A1A1A] border-white/10 text-white">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-white/5"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃 · 退出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-white/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-[#FDFCF9]">
        {/* Mobile top bar */}
        {isMobile && (
          <div className="flex border-b border-[#E8E5DF] h-14 items-center justify-between bg-[#0F0F0F] px-3 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg text-white/60 hover:text-white hover:bg-white/10" />
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm">
                  {activeMenuItem?.label ?? "메뉴"}
                </span>
                <span className="text-white/40 text-[10px]">
                  {activeMenuItem?.labelSub ?? ""}
                </span>
              </div>
            </div>
            <div
              className="text-white/60 font-black text-lg"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              한
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
