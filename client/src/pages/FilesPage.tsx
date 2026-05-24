import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Upload,
  File,
  FileText,
  Image,
  Music,
  Video,
  Trash2,
  Download,
  BookOpen,
  Headphones,
  PenLine,
  FolderOpen,
  X,
  AlertCircle,
  Loader2,
  CloudUpload,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";

type Category = "vocabulary" | "grammar" | "listening" | "reading" | "other";

const CATEGORY_CONFIG: Record<Category, {
  label: string; labelKo: string; icon: React.ElementType;
  color: string; bgColor: string;
}> = {
  vocabulary: { label: "词汇",   labelKo: "어휘",  icon: BookOpen,   color: "text-[#C9A84C]",  bgColor: "bg-[#FFFBF0] border-[#C9A84C]/30" },
  grammar:    { label: "语法",   labelKo: "문법",  icon: PenLine,    color: "text-[#E8432D]",  bgColor: "bg-[#FFF5F5] border-[#E8432D]/30" },
  listening:  { label: "听力",   labelKo: "듣기",  icon: Headphones, color: "text-[#2EC4B6]",  bgColor: "bg-[#F0FAFA] border-[#2EC4B6]/30" },
  reading:    { label: "阅读",   labelKo: "읽기",  icon: BookOpen,   color: "text-[#0F0F0F]",  bgColor: "bg-[#F7F4EE] border-[#E8E5DF]" },
  other:      { label: "其他",   labelKo: "기타",  icon: FolderOpen, color: "text-[#AAA]",     bgColor: "bg-[#F7F4EE] border-[#E8E5DF]" },
};

const MAX_FILE_SIZE = 16 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".mp3", ".wav", ".ogg", ".m4a", ".mp4",
  ".txt", ".doc", ".docx",
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType === "application/pdf" || mimeType.includes("word")) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FilesPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: "uploading" | "done" | "error" }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<number | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingCategory, setPendingCategory] = useState<Category>("other");
  const [pendingDescription, setPendingDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: filesData, isLoading } = trpc.files.list.useQuery();
  type FileItem = NonNullable<typeof filesData>[number];
  const files: FileItem[] = Array.isArray(filesData) ? filesData : (filesData as any)?.files ?? [];

  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate();
      toast.success("파일 업로드 완료! 文件上传成功！🎉");
    },
    onError: (err) => toast.error(`업로드 실패: ${err.message}`),
  });

  const deleteMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      utils.files.list.invalidate();
      toast.success("파일 삭제 완료 · 文件已删除");
      setDeleteDialogId(null);
    },
    onError: (err) => toast.error(`삭제 실패: ${err.message}`),
  });

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`파일이 너무 큽니다（最大 16MB）：${file.name}`);
      return;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`지원하지 않는 형식：${ext}`);
      return;
    }
    setPendingFile(file);
    setPendingCategory("other");
    setPendingDescription("");
    setUploadDialogOpen(true);
  }, []);

  const handleUploadConfirm = async () => {
    if (!pendingFile) return;
    setUploadDialogOpen(false);
    setUploadingFiles(prev => [...prev, { name: pendingFile.name, progress: "uploading" }]);
    try {
      const base64Data = await fileToBase64(pendingFile);
      await uploadMutation.mutateAsync({
        filename: pendingFile.name,
        mimeType: pendingFile.type || "application/octet-stream",
        base64Data,
        fileSize: pendingFile.size,
        category: pendingCategory,
        description: pendingDescription || undefined,
      });
      setUploadingFiles(prev =>
        prev.map(f => f.name === pendingFile.name ? { ...f, progress: "done" } : f)
      );
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.name !== pendingFile.name));
      }, 2000);
    } catch {
      setUploadingFiles(prev =>
        prev.map(f => f.name === pendingFile.name ? { ...f, progress: "error" } : f)
      );
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.name !== pendingFile.name));
      }, 3000);
    }
    setPendingFile(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const filteredFiles = files.filter(f => {
    const matchCat = selectedCategory === "all" || f.category === selectedCategory;
    const matchSearch = !searchQuery || f.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const categoryCounts = files.reduce((acc, f) => {
    const cat = f.category as Category;
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {} as Partial<Record<Category, number>>);

  const totalSize = files.reduce((a, f) => a + f.fileSize, 0);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="relative overflow-hidden bg-[#0F0F0F] rounded-2xl">
          <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden pr-6">
            <span
              className="text-[10rem] font-black text-white leading-none select-none"
              style={{ opacity: 0.04, fontFamily: "'Noto Serif KR', serif" }}
            >
              자
            </span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#2EC4B6] via-[#C9A84C] to-[#E8432D]" />
          <div className="relative z-10 px-6 py-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 bg-[#2EC4B6]/10 border border-[#2EC4B6]/20 text-[#2EC4B6] px-3 py-1 rounded-full text-xs font-semibold">
                <FolderOpen className="w-3 h-3" />
                자료실 · 学习资料库
              </div>
            </div>
            <h1
              className="text-3xl md:text-4xl font-black text-white leading-tight"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              자료실
            </h1>
            <p className="text-white/50 text-sm mt-1">Study Materials Archive · 学习资料管理</p>

            <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-white/10">
              <div>
                <div className="text-xl font-black text-white">{files.length}</div>
                <div className="text-[10px] text-white/40 font-medium">전체 파일 · 全部文件</div>
              </div>
              <div>
                <div className="text-xl font-black text-white">{formatFileSize(totalSize)}</div>
                <div className="text-[10px] text-white/40 font-medium">총 용량 · 总大小</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`card-luxury rounded-2xl p-8 text-center cursor-pointer transition-all border-2 border-dashed ${
            isDragOver
              ? "border-[#E8432D] bg-[#E8432D]/5 scale-[1.01]"
              : "border-[#E8E5DF] hover:border-[#C9A84C] hover:bg-[#FFFBF0]/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_EXTENSIONS.join(",")}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
          />
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all ${
            isDragOver ? "bg-[#E8432D] scale-110" : "bg-[#F7F4EE]"
          }`}>
            <CloudUpload className={`w-7 h-7 ${isDragOver ? "text-white" : "text-[#AAA]"}`} />
          </div>
          <div className="font-black text-base text-[#0F0F0F]">
            {isDragOver ? "파일을 여기에 놓으세요! · 松开即可上传！" : "파일을 드래그하거나 클릭하여 업로드"}
          </div>
          <div className="text-xs text-[#AAA] mt-1 font-medium">
            拖拽或点击上传 · PDF, 图片, 音频, Word 等 · 최대 16MB
          </div>

          {uploadingFiles.length > 0 && (
            <div className="mt-4 space-y-2 text-left">
              {uploadingFiles.map((f) => (
                <div key={f.name} className="flex items-center gap-2 bg-[#F7F4EE] rounded-xl px-3 py-2">
                  {f.progress === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-[#E8432D] flex-shrink-0" />}
                  {f.progress === "done" && <span className="text-emerald-500 text-sm flex-shrink-0">✓</span>}
                  {f.progress === "error" && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  <span className="text-xs font-medium text-[#555] truncate">{f.name}</span>
                  <span className="text-[10px] text-[#AAA] ml-auto flex-shrink-0">
                    {f.progress === "uploading" ? "업로드 중..." : f.progress === "done" ? "완료!" : "실패"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === "all"
                  ? "bg-[#0F0F0F] text-white"
                  : "bg-white border border-[#E8E5DF] text-[#666] hover:border-[#CCC]"
              }`}
            >
              전체 · 全部
              <span className="ml-1 opacity-60">({files.length})</span>
            </button>
            {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === key
                    ? "bg-[#0F0F0F] text-white"
                    : "bg-white border border-[#E8E5DF] text-[#666] hover:border-[#CCC]"
                }`}
              >
                <cat.icon className="w-3 h-3" />
                {cat.labelKo} · {cat.label}
                {(categoryCounts[key] ?? 0) > 0 && (
                  <span className="opacity-60">({categoryCounts[key]})</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#E8E5DF] rounded-xl px-3 py-2 sm:w-52">
            <Search className="w-3.5 h-3.5 text-[#AAA] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="파일 검색... · 搜索文件"
              className="bg-transparent text-xs font-medium text-[#333] placeholder:text-[#CCC] focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Files Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 card-luxury rounded-2xl">
            <Loader2 className="w-7 h-7 animate-spin text-[#E8432D]" />
            <span className="ml-3 font-bold text-[#888]">파일 로딩 중... · 加载中...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="card-luxury rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F7F4EE] flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-[#CCC]" />
            </div>
            <h3 className="text-xl font-black text-[#AAA]">파일 없음 · 暂无文件</h3>
            <p className="text-sm text-[#CCC] mt-2 font-medium">
              {searchQuery
                ? "검색 결과가 없습니다 · 未找到匹配文件"
                : "위의 업로드 영역에 파일을 드래그하세요 · 将文件拖拽到上方区域"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFiles.map((file, idx) => {
              const FileIcon = getFileIcon(file.mimeType);
              const catConfig = CATEGORY_CONFIG[file.category as Category] ?? CATEGORY_CONFIG.other;
              const CatIcon = catConfig.icon;
              return (
                <div
                  key={file.id}
                  className="card-luxury rounded-xl overflow-hidden"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#F7F4EE] flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-5 h-5 text-[#888]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#0F0F0F] truncate">{file.filename}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${catConfig.bgColor} ${catConfig.color}`}>
                          <CatIcon className="w-2.5 h-2.5" />
                          {catConfig.labelKo} · {catConfig.label}
                        </span>
                        <span className="text-[10px] text-[#AAA] font-medium">{formatFileSize(file.fileSize)}</span>
                      </div>
                      {file.description && (
                        <p className="text-xs text-[#888] mt-1.5 line-clamp-1">{file.description}</p>
                      )}
                      <div className="text-[10px] text-[#CCC] mt-1">
                        {new Date(file.createdAt).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex gap-2">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#F7F4EE] hover:bg-[#0F0F0F] hover:text-white text-[#555] text-xs font-bold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      다운로드 · 下载
                    </a>
                    <button
                      onClick={() => setDeleteDialogId(file.id)}
                      className="px-3 py-2 rounded-xl bg-[#F7F4EE] hover:bg-red-50 hover:text-red-500 text-[#AAA] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Confirm Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-[#E8E5DF]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">파일 업로드 설정 · 上传设置</DialogTitle>
            <DialogDescription className="text-sm font-medium text-[#888]">
              {pendingFile?.name} · {pendingFile ? formatFileSize(pendingFile.size) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-bold text-sm">카테고리 · 分类</Label>
              <Select value={pendingCategory} onValueChange={(v) => setPendingCategory(v as Category)}>
                <SelectTrigger className="rounded-xl border-[#E8E5DF] font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {(Object.entries(CATEGORY_CONFIG) as [Category, typeof CATEGORY_CONFIG[Category]][]).map(([key, cat]) => (
                    <SelectItem key={key} value={key} className="font-medium">
                      {cat.labelKo} · {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">메모 · 备注（선택사항）</Label>
              <Textarea
                value={pendingDescription}
                onChange={e => setPendingDescription(e.target.value)}
                placeholder="이 파일에 대한 설명을 추가하세요... · 添加文件说明..."
                className="rounded-xl border-[#E8E5DF] font-medium resize-none"
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setUploadDialogOpen(false); setPendingFile(null); }}
              className="rounded-xl font-bold"
            >
              <X className="w-4 h-4 mr-1" /> 취소 · 取消
            </Button>
            <Button
              onClick={handleUploadConfirm}
              disabled={uploadMutation.isPending}
              className="bg-[#E8432D] hover:bg-[#D03020] text-white font-bold border-0 rounded-xl"
            >
              {uploadMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> 업로드 중...</>
              ) : (
                <><Upload className="w-4 h-4 mr-1" /> 업로드 확인 · 确认上传</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogId !== null} onOpenChange={() => setDeleteDialogId(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-[#E8E5DF]">
          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" /> 삭제 확인 · 确认删除
            </DialogTitle>
            <DialogDescription className="font-medium text-[#666]">
              삭제 후 복구할 수 없습니다. 이 파일을 삭제하시겠습니까?
              <br />
              <span className="text-xs text-[#AAA]">删除后无法恢复，确认删除此文件？</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogId(null)} className="rounded-xl font-bold">
              취소 · 取消
            </Button>
            <Button
              onClick={() => deleteDialogId !== null && deleteMutation.mutate({ id: deleteDialogId })}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white font-bold border-0 rounded-xl"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> 삭제 중...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-1" /> 삭제 확인 · 确认删除</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
